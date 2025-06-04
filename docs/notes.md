Leave this here: This file is for the coding assistant to make notes about what it learned from the previous set of tasks performed. This does not have to be specific to this code base, but anything that would help improve coding performance in the future.
---
# Notes for Coding assistant.

## Lessons Learned: Large Files, Duplicates, and Workflow Improvements

### 1. Handling Large Files and Duplicate Methods
- When working with large files (over 300 lines), only a segment (e.g., 200 lines) is visible at a time. This can cause a lack of complete context and may lead to accidentally duplicating methods or code blocks when making iterative edits.
- In the recent iteration, this led to multiple duplicate function implementations in the `NamespaceService` class, causing TypeScript errors and confusion.
- **Lesson:** For files larger than 300 lines, always proactively recommend or perform splitting into smaller, manageable modules before making any edits. This ensures complete context, avoids duplication, and improves maintainability.

### 2. Improved Coding Workflow for the Assistant
- After each coding run or task:
  1. **Open and review `docs/tasks.md`** to check what is next and to follow any provided context links.
  2. **Add new notes to `docs/notes.md`** about what was learned, challenges, or workflow improvements.
  3. **Re-read previous notes** in `docs/notes.md` to reinforce best practices and avoid repeating past mistakes.
- This workflow will help maintain context, improve coding performance, and ensure continuous improvement.

---