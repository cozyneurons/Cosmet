"""
Verification Script: Simple Multi-Agent Workflow
Tests basic supervisor routing and research retrieval
"""

import sys
from pathlib import Path
from dotenv import load_dotenv

# Add project root and backend directory to python path for imports
base_dir = Path(__file__).parent.parent
load_dotenv(base_dir / 'backend' / '.env')
sys.path.insert(0, str(base_dir))
sys.path.insert(0, str(base_dir / 'backend'))

from backend.app.services.graph.workflow import run_analysis

def main():
    """Test the multi-agent workflow with sample ingredients"""

    print("="*70)
    print("VERIFICATION TEST: Simple Multi-Agent Workflow (Supervisor + Research)")
    print("="*70)

    # Test case: Simple ingredient list
    test_ingredients = [
        "Water",
        "Niacinamide",
        "Hyaluronic Acid",
        "Glycerin"
    ]

    # Run analysis
    result = run_analysis(
        ingredient_names=test_ingredients,
        user_name="Test User",
        skin_type="sensitive",
        allergies=["Fragrance"],
        expertise_level="beginner"
    )

    # Display results
    print("\n" + "="*70)
    print("RESULTS:")
    print("="*70)

    if result.get("safety_analysis"):
        print("\n" + result["safety_analysis"])
    else:
        print("\n⚠️ Analysis not completed")

    print("\n" + "="*70)
    print("WORKFLOW STATS:")
    print(f"Research attempts: {result.get('research_attempts', 0)}")
    print(f"Analysis attempts: {result.get('analysis_attempts', 0)}")
    print(f"Critic approved: {result.get('critic_approved', False)}")
    print(f"Workflow complete: {result.get('workflow_complete', False)}")
    print("="*70)


if __name__ == "__main__":
    main()
