# Runbook: PaymentService

## Common Issues

### NullPointerException at processPayment
- Check that the `User` object is not null before calling `processPayment()`
- Guest checkout must redirect to login before reaching payment
- Add null guard: `if (user == null) throw new IllegalStateException("User required")`
- Relevant code: `PaymentService.java:45`

### Payment timeout (>5s)
- Check downstream payment gateway latency via dashboard
- Increase `payment.gateway.timeout` from 3000ms to 8000ms in `application.yml`
- Add circuit breaker with fallback to retry queue
- Alert threshold: p99 > 4s

### Duplicate charges
- Caused by retry without idempotency key
- Add `Idempotency-Key: <order-id>` header to all gateway calls
- Check orders table for duplicate `transaction_id` before processing

## Escalation
- On-call: payments-team@company.com
- Runbook owner: @payments-eng
