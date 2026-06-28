"""
DAY 3: Critic Agent - Quality Validator
Powered by Gemini 3.1 Flash Lite
"""

import os
from typing import Dict
import google.generativeai as genai
from ..graph.state import AnalysisState


class CriticAgent:
    """
    Critic Agent: Validates quality of safety analysis

    Intelligence:
    • Multi-gate validation (completeness, allergen matching, consistency, tone)
    • Reject/Approve authority
    • Force retries with specific feedback
    • Track validation attempts

    Validation Gates:
    ✓ Completeness - All ingredients addressed
    ✓ Allergen Match - User allergies properly flagged
    ✓ Consistency - Safety scores match concern descriptions
    ✓ Tone Correctness - Appropriate for user expertise level

    Decision:
    • APPROVE → END (return to user)
    • REJECT → RETRY (send back to Analysis with feedback)
    """

    def __init__(self):
        """Initialize Critic Agent with Gemini 3.1 Flash Lite"""
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-3.1-flash-lite')

    def run(self, state: AnalysisState) -> Dict:
        """
        Validate safety analysis quality

        Process:
        1. Get analysis and user profile from state
        2. Run multi-gate validation:
           - Completeness check
           - Allergen matching check
           - Consistency check
           - Tone appropriateness check
        3. Generate detailed feedback if issues found
        4. Return APPROVE or REJECT decision

        Args:
            state: Current workflow state

        Returns:
            Updated state with critic_approved flag and critic_feedback
        """

        print("\n🔍 Critic Agent: Validating safety analysis quality...")

        safety_analysis = state.get("safety_analysis")
        ingredient_data = state.get("ingredient_data", [])
        allergies = state.get("allergies", [])
        expertise_level = state.get("expertise_level", "beginner")
        total_critic_rejections = state.get("total_critic_rejections", 0)

        if not safety_analysis:
            print("❌ Critic Agent: No analysis to validate")
            return {
                "critic_approved": False,
                "critic_feedback": "No analysis provided to validate.",
                "messages": [{
                    "role": "assistant",
                    "content": "No analysis available for validation."
                }]
            }

        # Build validation prompt
        prompt = self._build_validation_prompt(
            safety_analysis=safety_analysis,
            ingredient_data=ingredient_data,
            allergies=allergies,
            expertise_level=expertise_level
        )

        try:
            # Validate using Gemini
            response = self.model.generate_content(prompt)
            validation_result = response.text

            # Parse the decision (check for NON_COSMETIC rejection first)
            if "NON_COSMETIC" in validation_result.upper():
                print("  🚫 Critic REJECTED: Non-cosmetic product detected!")
                return {
                    "critic_approved": False,
                    "invalid_product": True,
                    "critic_feedback": "The provided ingredient list appears to belong to a non-cosmetic item (e.g. food, beverage, or cleaning product). Skincare safety analysis is not applicable.",
                    "analysis_complete": True,
                    "messages": [{
                        "role": "assistant",
                        "content": "Alert: The product is not a cosmetic formulation and has been rejected by the safety validator."
                    }]
                }

            is_approved = "APPROVE" in validation_result.upper() and "REJECT" not in validation_result.upper()

            if is_approved:
                print("  ✅ Critic APPROVED: Analysis meets quality standards")
                return {
                    "critic_approved": True,
                    "critic_feedback": None,
                    "messages": [{
                        "role": "assistant",
                        "content": "Analysis validated and approved by quality critic."
                    }]
                }
            else:
                print("  ❌ Critic REJECTED: Analysis needs improvements")
                print(f"  📝 Feedback: {validation_result[:200]}...")
                return {
                    "critic_approved": False,
                    "critic_feedback": validation_result,
                    "analysis_complete": False,  # Force re-analysis
                    "total_critic_rejections": total_critic_rejections + 1,
                    "messages": [{
                        "role": "assistant",
                        "content": "Analysis rejected by critic. Generating improved version..."
                    }]
                }

        except Exception as e:
            print(f"❌ Critic Agent error: {e}")
            # On error, approve to avoid blocking workflow
            return {
                "critic_approved": True,
                "critic_feedback": None,
                "messages": [{
                    "role": "assistant",
                    "content": f"Critic validation error, proceeding with analysis: {str(e)}"
                }]
            }

    def _build_validation_prompt(
        self,
        safety_analysis: str,
        ingredient_data: list,
        allergies: list,
        expertise_level: str
    ) -> str:
        """Build validation prompt for quality checking"""

        ingredient_names = [ing['name'] for ing in ingredient_data]
        allergen_list = ', '.join(allergies) if allergies else 'None'

        prompt = f"""You are a quality validator for cosmetic ingredient safety analyses. Your job is to validate the analysis below using strict quality gates.

ORIGINAL INGREDIENT LIST ({len(ingredient_names)} ingredients):
{', '.join(ingredient_names)}

USER ALLERGIES:
{allergen_list}

USER EXPERTISE LEVEL:
{expertise_level}

ANALYSIS TO VALIDATE:
{safety_analysis}

VALIDATION GATES (all must pass):

1. ✓ COMPLETENESS CHECK
   - Are ALL {len(ingredient_names)} ingredients addressed in the analysis?
   - Does EVERY ingredient have: Name, Purpose, Safety Rating, Concerns, Recommendation?
   - Missing ingredients: [list any]

2. ✓ FORMAT CHECK
   - Is the ingredient analysis presented as a markdown TABLE?
   - Does the table have these columns: Ingredient | Purpose | Safety Rating | Concerns | Recommendation
   - Does EVERY ingredient have a row in the table with ALL columns filled?
   - Ingredients missing Purpose field: [list any]
   - Format violations: [list any]

3. ✓ ALLERGEN MATCH CHECK
   - User allergens/avoidance list: {allergen_list}
   - Are all ingredients in the product that match the user's allergens/avoidance list properly flagged in the table with ⚠️ ALLERGEN/INGREDIENT TO AVOID? (If there are no allergen matches in the product, this gate passes, and no ingredients should be flagged.)
   - Are matched items marked as AVOID?
   - Missing allergen flags: [list any]

4. ✓ CONSISTENCY CHECK
   - Do safety scores (1-10) match the concern descriptions?
   - Example: Score 7-10 should have serious concerns, score 1-3 should be safe
   - Inconsistencies: [list any]

5. ✓ TONE APPROPRIATENESS CHECK
   - Expertise level: {expertise_level}
   - Beginner: Simple language, no jargon?
   - Intermediate: Moderate technical detail?
   - Expert: Technical terminology and mechanisms?
   - Tone issues: [list any]

6. ✓ PRODUCT RELEVANCE & SUITABILITY CHECK
   - Based on the combined list of ingredients, determine whether this product is intended for cosmetic/topical skincare application.
   - Ingredients that indicate a non-cosmetic product include: carbonated water, taurine, caffeine, citric acid (as a beverage acidulant), sucralose, erythritol, artificial sweeteners, food dyes, sodium benzoate (as a food preservative), natural flavors (food context), or other food/beverage/pharmaceutical/cleaning chemicals.
   - If the ingredient combination clearly describes a food product, beverage, drug, or household cleaner rather than a topical cosmetic, this gate FAILS.
   - Cosmetics are products applied topically to the skin, hair, or nails.
   - Product relevance issues: [list any]

DECISION:
Based on the validation gates above, respond with ONE of:

APPROVE
[If all gates pass] The analysis is complete, accurate, and appropriate.

REJECT: NON_COSMETIC
[If Gate 6 fails — the ingredient list is from a food/beverage/drug/cleaning product, not a cosmetic]
Provide: What type of product these ingredients suggest, and why skincare analysis is not applicable.

REJECT: IMPROVE
[If Gates 1–5 fail but the product IS cosmetic] Provide specific feedback:
- Which gates failed
- What is missing or incorrect
- How to fix it

Be strict but fair. Provide clear, actionable feedback for improvements.

YOUR DECISION:
"""
        return prompt
