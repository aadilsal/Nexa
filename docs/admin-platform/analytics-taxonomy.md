# Analytics Event Taxonomy

All events are validated server-side. Forbidden property keys are stripped/rejected.

## Core events

| Event | When | Allowed properties |
|-------|------|-------------------|
| `page_viewed` | Route change | `path` |
| `session_started` | App session start | — |
| `session_ended` | Tab close | — |
| `signup_completed` | Signup success | — |
| `onboarding_completed` | Onboarding finish | — |
| `dashboard_viewed` | Dashboard load | — |
| `ai_insight_viewed` | Insight shown | — |
| `transaction_logged` | Transaction created | `type`: expense \| income |
| `transaction_recategorized` | Category change | — |
| `simulation_run` | Can I Buy run | `recommendation` |
| `ai_chat_message_sent` | Chat message | — |
| `weekly_review_opened` | Weekly review | — |
| `data_exported` | Export | `format`: json \| csv |
| `account_deleted` | Account deletion | — |
| `support_ticket_created` | Support submit | `category` |
| `error_occurred` | Frontend error | `message`, `source` |

## Forbidden properties (never send)

`amount`, `category`, `merchant`, `safeToSpend`, `healthScore`, `goalName`, `goalAmount`, `balance`, `salary`, `income`, `expense`, `description`, `target`, `progress`, `zakat`, `charity`

## Signing

When `ANALYTICS_EVENT_SIGNING_SECRET` is set:

1. Client fetches `GET /analytics/sign-key` (session-scoped)
2. Signs batch body with HMAC-SHA256
3. Sends `x-analytics-signature` header on `POST /analytics/events/batch`
