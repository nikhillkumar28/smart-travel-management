const requirementsAnalysisSchema = {
  type: 'object',
  properties: {
    travelStyle: { type: 'string' },
    priorityCategories: { type: 'array', items: { type: 'string' } },
    budgetConsiderations: { type: 'array', items: { type: 'string' } },
    planningConstraints: { type: 'array', items: { type: 'string' } }
  },
  required: ['travelStyle', 'priorityCategories', 'budgetConsiderations', 'planningConstraints']
};

const candidateActivitiesSchema = {
  type: 'object',
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: { type: 'string' },
          description: { type: 'string' },
          estimatedCost: { type: 'string' },
          suggestedTime: { type: 'string' }
        },
        required: ['name', 'category', 'description', 'estimatedCost', 'suggestedTime']
      }
    }
  },
  required: ['candidates']
};

const finalItinerarySchema = {
  type: 'object',
  properties: {
    destination: { type: 'string' },
    totalDays: { type: 'integer' },
    estimatedBudget: { type: 'string' },
    days: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          day: { type: 'integer' },
          title: { type: 'string' },
          activities: {
            type: 'object',
            properties: {
              morning: { type: 'string' },
              afternoon: { type: 'string' },
              evening: { type: 'string' }
            },
            required: ['morning', 'afternoon', 'evening']
          },
          places: { type: 'array', items: { type: 'string' } },
          food: { type: 'array', items: { type: 'string' } },
          travelTips: { type: 'string' },
          estimatedCost: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['day', 'title', 'activities', 'places', 'food', 'travelTips', 'estimatedCost', 'reason']
      }
    }
  },
  required: ['destination', 'totalDays', 'estimatedBudget', 'days']
};

function jsonInstruction(schema) {
  return `Return only valid JSON that matches this schema:\n${JSON.stringify(schema, null, 2)}`;
}

function buildRequirementsPrompt({ destination, days, budget, interests }) {
  return `Analyze travel requirements for a realistic trip.\n\nDestination: ${destination}\nDays: ${days}\nBudget: ${budget}\nInterests: ${interests}\n\nIdentify travel style, priorities, budget considerations, and practical constraints. Do not propose a day-by-day itinerary yet.\n\n${jsonInstruction(requirementsAnalysisSchema)}`;
}

function buildCandidatesPrompt(input, analysis) {
  return `Create a focused candidate activity list for a realistic trip.\n\nTrip input:\n${JSON.stringify(input, null, 2)}\n\nRequirements analysis:\n${JSON.stringify(analysis, null, 2)}\n\nProvide enough attractions, activities, and food experiences for ${input.days} days, but avoid overloaded schedules, duplicate ideas, and unrealistic travel.\n\n${jsonInstruction(candidateActivitiesSchema)}`;
}

function buildFinalItineraryPrompt(input, analysis, candidates) {
  return `Build a practical multi-day travel itinerary using the prepared planning data.\n\nTrip input:\n${JSON.stringify(input, null, 2)}\n\nRequirements analysis:\n${JSON.stringify(analysis, null, 2)}\n\nCandidate activities:\n${JSON.stringify(candidates, null, 2)}\n\nCreate exactly ${input.days} days. Each day must have one morning, afternoon, and evening activity, a realistic estimated cost, and a short reason the plan fits the traveler. Keep the schedule balanced and within the stated budget.\n\n${jsonInstruction(finalItinerarySchema)}`;
}

module.exports = {
  requirementsAnalysisSchema,
  candidateActivitiesSchema,
  finalItinerarySchema,
  buildRequirementsPrompt,
  buildCandidatesPrompt,
  buildFinalItineraryPrompt
};
