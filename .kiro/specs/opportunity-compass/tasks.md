# Calendar regression tasks

1. Add a regression for a selected candidate deadline before a law reference and controls for legal and incomplete dates.
2. Run the test before the change and record the failure.
3. In `noticeCalendar()`, retain a matching explicit candidate only if it precedes the first legal marker on the selected line. Leave the other paths in place.
4. Run the local test suite, review the result and document that this conservative rule may both omit and misclassify dates.

Kiro CLI created the initial tests and implementation during this task; the implementation and tests were reviewed and corrected by the developer. Evidence of the before/after local hook runs is retained outside the public repository.
