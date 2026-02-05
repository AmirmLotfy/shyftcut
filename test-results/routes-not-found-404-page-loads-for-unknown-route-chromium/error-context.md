# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]: ا
  - generic [ref=e3]:
    - region "Notifications (F8)":
      - list
    - region "Notifications alt+T"
    - generic [ref=e7]:
      - heading "404" [level=1] [ref=e8]
      - heading "Page Not Found" [level=2] [ref=e9]
      - paragraph [ref=e10]: The page you're looking for doesn't exist or has been moved.
      - generic [ref=e11]:
        - button "Go Back" [ref=e12] [cursor=pointer]:
          - img
          - text: Go Back
        - link "Home" [ref=e13] [cursor=pointer]:
          - /url: /
          - img
          - text: Home
```