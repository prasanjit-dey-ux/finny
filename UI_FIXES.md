# Finny UI Fixes — Summary

## Screen 1: AI Chat (`finny.tsx`)

### Fix 1: Remove excess bottom padding between messages and pills/input
```diff
- msgList: { padding: s(20), paddingBottom: vs(8) }
+ msgList: { padding: s(20), paddingBottom: vs(4), flexGrow: 1 }
```
```diff
  chipScroll: {
    paddingHorizontal: s(16),
-   paddingVertical: vs(8),
+   paddingTop: vs(6),
+   paddingBottom: vs(4),
  }
```
```diff
  inputBar: {
-   paddingVertical: vs(6),
+   paddingTop: vs(4),
+   paddingBottom: vs(6),
  }
```

### Fix 2: Pill buttons — match AI bubble style (#EFF6FF bg, #3DA4FC text, no border)
```diff
  chatChip: {
-   backgroundColor: "#FFFFFF",
+   backgroundColor: "#EFF6FF",
-   borderWidth: 1,
-   borderColor: "#E4E4E7",
  }
  chatChipText: {
-   color: "#268FFF",
+   color: "#3DA4FC",
  }
```
Same for empty-state chips:
```diff
  emptyChip: {
-   backgroundColor: "#FFFFFF",
+   backgroundColor: "#EFF6FF",
-   borderWidth: 1,
-   borderColor: "#E4E4E7",
  }
  emptyChipText: {
-   color: "#268FFF",
+   color: "#3DA4FC",
  }
```

---

## Screen 2: Onboarding Chat (`welcome.tsx`)

### Fix 3: Messages start from top (flex-start), not vertically centered
```diff
  messagesContent: {
-   padding: s(16),
+   paddingHorizontal: s(16),
+   paddingTop: s(12),
+   flexGrow: 0,   // prevents content from stretching to fill ScrollView
  }
```

### Fix 4: Pill buttons — same #EFF6FF / #3DA4FC treatment, no border
```diff
  chip: {
-   backgroundColor: "#F4F4F5",
+   backgroundColor: "#EFF6FF",
-   borderWidth: 1.5,
-   borderColor: "#E5E5E5",
  }
  chipSelected: {
-   backgroundColor: "#18181B",
-   borderColor: "#18181B",
+   backgroundColor: "#3DA4FC",
  }
  chipText: {
-   color: "#18181B",
+   color: "#3DA4FC",
  }
```

### Fix 5: Finny bubble color matches AI chat screen
```diff
  bubbleFinny: {
-   backgroundColor: "#F4F4F5",
+   backgroundColor: "#EFF6FF",
  }
```
