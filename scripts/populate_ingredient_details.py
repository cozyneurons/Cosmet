import sys
import os
import json
import logging
import ssl
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
base_dir = Path(__file__).parent.parent
load_dotenv(base_dir / 'backend' / '.env')

# Add project root to python path for imports
sys.path.insert(0, str(base_dir))
from backend.app.services.embeddings import EmbeddingGenerator, QdrantUploader

def get_gemini_client():
    """Initialize and configure Gemini client"""
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("GOOGLE_API_KEY / GEMINI_API_KEY not found in environment!")
        sys.exit(1)
    
    # Setup unverified SSL context for Python urllib on macOS if needed
    try:
        ssl._create_default_https_context = ssl._create_unverified_context
    except Exception:
        pass

    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-3.1-flash-lite')
def is_default_ingredient(ing):
    """Check if the ingredient has empty or placeholder/default data"""
    purpose = ing.get('purpose', '').strip()
    description = ing.get('description', '').strip()
    safety_score = ing.get('safety_score')
    
    # Check if empty, null, or matching standard fallback placeholders
    if not purpose or purpose.lower() in ["", "unknown purpose", "cosmetic ingredient", "search error", "web search unavailable"]:
        return True
    if not description or "is used in cosmetic" in description.lower() or description.lower() == "fallback mock description":
        return True
    if safety_score is None:
        return True
        
    return False

def populate_details(ingredients, model, batch_size=10):
    """Populate details for all ingredients using Gemini in batches"""
    populated = []
    
    # Only populate ingredients that have default or placeholder data
    to_populate = [ing for ing in ingredients if is_default_ingredient(ing)]
    
    logger.info(f"Total ingredients: {len(ingredients)}. Need to populate: {len(to_populate)}")
    
    for i in range(0, len(to_populate), batch_size):
        batch = to_populate[i:i + batch_size]
        batch_names = [ing['name'] for ing in batch]
        
        logger.info(f"Processing batch {i//batch_size + 1}/{(len(to_populate)-1)//batch_size + 1}: {batch_names}")
        
        prompt = f"""
You are an expert cosmetic chemistry database. For the following list of cosmetic ingredients, provide their primary cosmetic purpose (1-3 words, e.g. "Humectant", "Surfactant", "Preservative", "Antioxidant"), a concise explanation (2-3 sentences) of what it is and how it benefits the skin, an EWG-style safety score (integer from 1 to 10, where 1 is safest and 10 is most hazardous), and a list of skin concerns (e.g. ["irritation"], ["contact dermatitis"], ["comedogenic"], ["dryness"], or ["none"]).

Ingredients list:
{json.dumps(batch_names, indent=2)}

Return the output strictly as a JSON array of objects with the following format:
[
  {{
    "name": "Ingredient Name",
    "purpose": "Primary Purpose",
    "description": "Description of benefits.",
    "safety_score": 1,
    "concerns": ["none"]
  }},
  ...
]
Do not return any markdown formatting or any text outside of the JSON block. Ensure the JSON is valid.
"""
        try:
            response = model.generate_content(prompt)
            text_response = response.text.strip()
            
            # Clean potential markdown wrappers
            if text_response.startswith("```json"):
                text_response = text_response.split("```json")[1].split("```")[0].strip()
            elif text_response.startswith("```"):
                text_response = text_response.split("```")[1].split("```")[0].strip()
                
            batch_results = json.loads(text_response)
            
            # Map results back to ingredients
            result_map = {res['name'].lower().strip(): res for res in batch_results if 'name' in res}
            
            for ing in batch:
                name_key = ing['name'].lower().strip()
                result = result_map.get(name_key)
                if not result:
                    # Try partial or search match
                    matches = [res for k, res in result_map.items() if k in name_key or name_key in k]
                    if matches:
                        result = matches[0]
                        
                if result:
                    ing['purpose'] = result.get('purpose', 'Cosmetic Ingredient')
                    ing['description'] = result.get('description', '')
                    ing['safety_score'] = result.get('safety_score')
                    ing['concerns'] = result.get('concerns', ['none'])
                else:
                    logger.warning(f"Could not find matching results for {ing['name']}")
                    ing['purpose'] = "Cosmetic Ingredient"
                    ing['description'] = f"{ing['name']} is used in cosmetic products."
                    ing['safety_score'] = 1
                    ing['concerns'] = ["none"]
                    
                populated.append(ing)
                
        except Exception as e:
            logger.error(f"Error processing batch: {e}")
            # Use safe fallbacks for the batch to continue
            for ing in batch:
                ing['purpose'] = "Cosmetic Ingredient"
                ing['description'] = f"{ing['name']} is used in cosmetic formulations."
                ing['safety_score'] = 1
                ing['concerns'] = ["none"]
                populated.append(ing)
                
        # Sleep to keep it under 5 requests per minute
        if i + batch_size < len(to_populate):
            import time
            logger.info("Sleeping 60 seconds to adhere to rate limits (max 5 requests per minute)...")
            time.sleep(60)
            
    # Combine back with any already populated ingredients (if any)
    final_ingredients = []
    populated_map = {ing['name'].lower().strip(): ing for ing in populated}
    
    for ing in ingredients:
        name_key = ing['name'].lower().strip()
        if name_key in populated_map:
            final_ingredients.append(populated_map[name_key])
        else:
            final_ingredients.append(ing)
            
    return final_ingredients

def main():
    final_json_path = base_dir / 'data' / 'processed' / 'ingredients_final.json'
    embeddings_json_path = base_dir / 'data' / 'processed' / 'ingredients_with_embeddings.json'
    
    if not final_json_path.exists():
        logger.error(f"File not found: {final_json_path}")
        sys.exit(1)
        
    logger.info(f"Loading ingredients from {final_json_path}...")
    with open(final_json_path, 'r', encoding='utf-8') as f:
        ingredients = json.load(f)
        
    # 1. Populate details via Gemini
    logger.info("Initializing Gemini Model...")
    model = get_gemini_client()
    
    logger.info("Populating ingredient details using Gemini...")
    populated_ingredients = populate_details(ingredients, model, batch_size=10)
    
    # Save back populated details to final json
    logger.info(f"Saving populated ingredients back to {final_json_path}...")
    with open(final_json_path, 'w', encoding='utf-8') as f:
        json.dump(populated_ingredients, f, indent=2, ensure_ascii=False)
        
    # 2. Regenerate embeddings
    logger.info("Initializing Embedding Generator...")
    embedder = EmbeddingGenerator()
    
    logger.info("Generating new embeddings...")
    ingredients_with_embeddings = embedder.generate_embeddings(populated_ingredients)
    
    logger.info(f"Saving updated embeddings to {embeddings_json_path}...")
    embedder.save_embeddings(ingredients_with_embeddings, embeddings_json_path)
    
    # 3. Upload to local Qdrant
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    logger.info(f"Connecting to Qdrant at {qdrant_url}...")
    
    uploader = QdrantUploader()
    logger.info("Recreating collection 'cosmetic_ingredients'...")
    uploader.create_collection(vector_size=384)
    
    logger.info(f"Uploading {len(ingredients_with_embeddings)} points to Qdrant...")
    uploader.upload_embeddings(ingredients_with_embeddings)
    
    logger.info("Running verification test search for 'niacinamide'...")
    uploader.test_search("niacinamide for skin brightening", top_k=3)
    
    logger.info("Populate and Re-seeding completed successfully!")

if __name__ == "__main__":
    main()
