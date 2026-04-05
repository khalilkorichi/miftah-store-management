## UI Pro Max Stack Guidelines
**Stack:** react | **Query:** layout responsive form
**Source:** stacks/react.csv | **Found:** 3 results

### Result 1
- **Category:** Accessibility
- **Guideline:** Label form controls
- **Description:** Associate labels with inputs
- **Do:** htmlFor matching input id
- **Don't:** Placeholder as only label
- **Code Good:** <label htmlFor="email">Email</label>
- **Code Bad:** <input placeholder="Email"/>
- **Severity:** High
- **Docs URL:** 

### Result 2
- **Category:** State
- **Guideline:** Initialize state lazily
- **Description:** Use function form for expensive initial state
- **Do:** useState(() => computeExpensive())
- **Don't:** useState(computeExpensive())
- **Code Good:** useState(() => JSON.parse(data))
- **Code Bad:** useState(JSON.parse(data))
- **Severity:** Medium
- **Docs URL:** https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state

### Result 3
- **Category:** Forms
- **Guideline:** Controlled components for forms
- **Description:** Use state to control form inputs
- **Do:** value + onChange for inputs
- **Don't:** Uncontrolled inputs with refs
- **Code Good:** <input value={val} onChange={setVal}>
- **Code Bad:** <input ref={inputRef}>
- **Severity:** Medium
- **Docs URL:** https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable

