<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/af775547-8de3-406a-b238-e1f3f2144787

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy To GitHub Pages

1. Push this repository to GitHub.
2. In GitHub repo settings, open `Pages`.
3. Set `Build and deployment` source to `GitHub Actions`.
4. Push to `main`, then wait for workflow `Deploy To GitHub Pages` to finish.
5. Open your Pages URL.

Notes:
- This project is a Vite app. Do not deploy raw source files directly.
- The site must serve the build output from `dist/`.

## License

This project is licensed under the Creative Commons Attribution 4.0 International License (CC BY 4.0).  
See [LICENSE](./LICENSE) for details.
