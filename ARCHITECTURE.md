# ARCHITECTURE: Production Hardening Checklist

## Cloud Run Configuration
```yaml
# service.yaml
spec:
  template:
    spec:
      containerConcurrency: 80      # Tune based on memory
      timeoutSeconds: 60            # Gemini can be slow
      containers:
        - resources:
            limits:
              cpu: "1"
              memory: "512Mi"
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "0"    # Scale to zero
        autoscaling.knative.dev/maxScale: "10"   # Cap costs
```

## Rate Limiting
- Implement per-IP rate limiting: 20 generations/hour
- Use Cloud Armor or middleware (express-rate-limit)
- Return 429 with friendly message: "You're exploring fast! Take a breath and try again in a few minutes."

## Error Handling
```typescript
// Graceful degradation
const generateScenario = async (input: ScenarioInput): Promise<ScenarioResponse> => {
  try {
    return await geminiService.generate(input);
  } catch (error) {
    if (error.code === 'RESOURCE_EXHAUSTED') {
      // Gemini quota hit — return cached "evergreen" scenario
      return getCachedScenario(input.signal_id, input.role, input.industry);
    }
    if (error.code === 'DEADLINE_EXCEEDED') {
      // Timeout — return partial with message
      return { 
        ...partialScenario,
        _meta: { degraded: true, reason: 'generation_timeout' }
      };
    }
    throw error;
  }
};
```

## Caching Strategy
- Cache generated scenarios in Firestore: `cache/scenarios/{hash}`
- Hash = `signal_id + role + industry`
- TTL: 24 hours (fresh enough, saves API costs)
- On cache hit: Return immediately, optionally regenerate in background

## Monitoring
- Cloud Run metrics: Latency p50/p95, Error rate, Instance count
- Custom metrics to Cloud Monitoring:
  - `scenario_generation_latency`
  - `scenario_generation_success_rate`
  - `cache_hit_rate`
  - `email_capture_rate`

## Security
- API key in Secret Manager (not env var)
- CORS locked to your domains only
- Input validation on all endpoints
- Sanitize LLM output before rendering (XSS prevention)

## Cost Controls
- Set Cloud Run budget alert at $50/day
- Gemini API budget cap in GCP Console
- Monitor: Avg cost per scenario generation