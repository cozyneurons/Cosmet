"""
DAY 2: Supervisor Agent - Strategic Workflow Orchestrator
Powered by Gemini 3.1 Flash Lite
"""

import os
from typing import Dict
import google.generativeai as genai
from ..graph.state import AnalysisState


class SupervisorAgent:
    """
    Supervisor Agent: Analyzes workflow state and routes to next appropriate agent

    Core Intelligence:
    - Analyzes current workflow state (what's done, what's missing)
    - Routes to next appropriate agent based on state conditions
    - Manages retry logic (max 5 attempts per agent)
    - Tracks attempt counts and escalates if needed
    - Detects workflow completion (all validations passed)
    """

    def __init__(self):
        """Initialize Supervisor with Gemini 3.1 Flash Lite"""
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-3.1-flash-lite')

    def route(self, state: AnalysisState) -> Dict:
        """
        Analyze current state and decide next agent to route to

        Routing Decision Logic:
        ┌──────────────────────────┬─────────────────┬──────────────────────────┐
        │ State Condition          │ Next Agent      │ Reasoning                │
        ├──────────────────────────┼─────────────────┼──────────────────────────┤
        │ missing_ingredients      │ → Research      │ Need ingredient data     │
        │ data_complete + no_analysis │ → Analysis   │ Generate safety report   │
        │ analysis_exists + not_validated │ → Critic │ Quality check needed     │
        │ critic_approved          │ → END           │ Return to user           │
        │ critic_rejected          │ → Analysis (retry) │ Improve with feedback│
        │ max_retries_exceeded     │ → END (partial) │ Return best effort       │
        └──────────────────────────┴─────────────────┴──────────────────────────┘

        Args:
            state: Current workflow state

        Returns:
            Updated state with next_agent decision
        """

        # Extract state fields
        research_complete = state.get("research_complete", False)
        analysis_complete = state.get("analysis_complete", False)
        critic_approved = state.get("critic_approved", False)
        research_attempts = state.get("research_attempts", 0)
        analysis_attempts = state.get("analysis_attempts", 0)
        max_retries = state.get("max_retries", 5)  # Allow up to 5 retry attempts

        # Decision 0: Non-cosmetic product detected — terminate immediately
        if state.get("invalid_product", False):
            print("🚫 Supervisor: Non-cosmetic product detected. Stopping workflow.")
            return {
                "next_agent": "END",
                "workflow_complete": True
            }

        # Decision 1: Check if workflow complete (critic approved)
        if critic_approved:
            print("✅ Supervisor: Critic approved. Workflow complete!")
            return {
                "next_agent": "END",
                "workflow_complete": True
            }

        # Decision 2: Route based on current state
        if not research_complete:
            if research_attempts >= max_retries:
                print("⚠️ Supervisor: Max research retries exceeded. Ending with partial results.")
                return {
                    "next_agent": "END",
                    "workflow_complete": True,
                    "messages": [{
                        "role": "assistant",
                        "content": "Unable to complete ingredient research after maximum attempts. Returning partial results."
                    }]
                }
            print(f"🔄 Supervisor: Ingredient data missing. Routing to Research Agent (attempt {research_attempts + 1})")
            return {
                "next_agent": "research",
                "workflow_complete": False
            }

        if research_complete and not analysis_complete:
            # Check if this is a retry (critic rejected before)
            critic_feedback = state.get("critic_feedback")
            if critic_feedback:
                if analysis_attempts >= max_retries:
                    print("⚠️ Supervisor: Max analysis retries exceeded. Ending with best effort.")
                    return {
                        "next_agent": "END",
                        "workflow_complete": True,
                        "messages": [{
                            "role": "assistant",
                            "content": "Analysis validation not perfect but returning best available results."
                        }]
                    }
                print(f"🔄 Supervisor: Critic rejected. Routing back to Analysis Agent for improvements (attempt {analysis_attempts + 1})")
                return {
                    "next_agent": "analysis",
                    "workflow_complete": False
                }
            else:
                if analysis_attempts >= max_retries:
                    print("⚠️ Supervisor: Max analysis retries exceeded. Ending with best effort.")
                    return {
                        "next_agent": "END",
                        "workflow_complete": True,
                        "messages": [{
                            "role": "assistant",
                            "content": "Analysis validation not perfect but returning best available results."
                        }]
                    }
                print(f"🔄 Supervisor: Research done. Routing to Analysis Agent (attempt {analysis_attempts + 1})")
                return {
                    "next_agent": "analysis",
                    "workflow_complete": False
                }

        if research_complete and analysis_complete and not critic_approved:
            print("🔄 Supervisor: Analysis complete. Routing to Critic Agent for validation")
            return {
                "next_agent": "critic",
                "workflow_complete": False
            }

        # Fallback: Something went wrong
        print("⚠️ Supervisor: Unexpected state. Ending workflow.")
        return {
            "next_agent": "END",
            "workflow_complete": True,
            "messages": [{
                "role": "assistant",
                "content": "Unexpected workflow state. Please try again."
            }]
        }
