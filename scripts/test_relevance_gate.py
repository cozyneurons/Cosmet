"""
Verification Script: Product Relevance Gate
Tests that a non-cosmetic product (energy drink) is rejected by the Critic Agent
"""

import sys
from pathlib import Path
from dotenv import load_dotenv

base_dir = Path(__file__).parent.parent
load_dotenv(base_dir / 'backend' / '.env')
sys.path.insert(0, str(base_dir))
sys.path.insert(0, str(base_dir / 'backend'))

from backend.app.services.graph.workflow import run_analysis


def test_energy_drink():
    print("=" * 70)
    print("RELEVANCE GATE TEST: Energy Drink Ingredients (should be REJECTED)")
    print("=" * 70)

    energy_drink_ingredients = [
        "Carbonated Water",
        "Sucrose",
        "Glucose",
        "Citric Acid",
        "Taurine",
        "Sodium Bicarbonate",
        "Magnesium Carbonate",
        "Caffeine",
        "Niacinamide",
        "Sucralose",
        "Natural Flavors",
        "Sodium Benzoate",
    ]

    result = run_analysis(
        ingredient_names=energy_drink_ingredients,
        user_name="Test User",
        skin_type="normal",
        allergies=[],
        expertise_level="beginner"
    )

    print("\n" + "=" * 70)
    print("RESULTS:")
    print("=" * 70)

    invalid = result.get("invalid_product", False)
    critic_approved = result.get("critic_approved", False)
    feedback = result.get("critic_feedback", "")

    if invalid:
        print("\n✅ PASS: Product correctly identified as NON-COSMETIC!")
        print(f"\n🚫 Critic Feedback:\n{feedback}")
    else:
        print("\n❌ FAIL: Product was NOT rejected as non-cosmetic.")
        print(f"\n   critic_approved: {critic_approved}")
        print(f"\n   Safety Analysis:\n{result.get('safety_analysis', 'N/A')[:300]}")

    print("\n" + "=" * 70)
    print("WORKFLOW STATS:")
    print(f"invalid_product: {invalid}")
    print(f"critic_approved: {critic_approved}")
    print(f"workflow_complete: {result.get('workflow_complete', False)}")
    print("=" * 70)


if __name__ == "__main__":
    test_energy_drink()
