# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: Create an account
      - generic [ref=e6]: Choose your preferred sign up method
    - generic [ref=e7]:
      - button "Continue with Google" [ref=e8]:
        - img
        - text: Continue with Google
      - generic [ref=e13]: Or continue with
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Email
          - textbox "Email" [ref=e17]
        - button "Continue with magic link" [ref=e18]:
          - img
          - text: Continue with magic link
    - paragraph [ref=e20]:
      - text: Already have an account?
      - link "Sign in" [ref=e21] [cursor=pointer]:
        - /url: /login
  - region "Notifications alt+T"
```