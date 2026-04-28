# DermAI 🩺 - Google Solution Challenge

DermAI is an AI-powered skin disease analysis and clinic locator application built for the **Google Solution Challenge**. The application aims to democratize access to dermatological insights by providing instant, AI-driven skin assessments and connecting users with local healthcare professionals.

## 🌍 UN Sustainable Development Goals
DermAI directly addresses **Goal 3: Good Health and Well-being** by promoting accessible healthcare and providing early insights into potential skin conditions.

## ✨ Features
*   **🤖 AI Skin Analysis**: Upload or capture images of skin conditions to receive instant analysis and comprehensive medical information powered by the **Google Gemini API**.
*   **🏥 Clinic Locator**: Integrated with the **Google Maps API** to automatically locate and display nearby dermatology clinics and hospitals based on the user's location, allowing them to easily book appointments.
*   **🌐 Multilingual Support**: Accessible to a global audience with built-in language search and translation capabilities.
*   **🔒 Privacy-First Design**: Robust data privacy measures, including user-controlled data management (export/delete) and mandatory consent flows for skin scans.
*   **📊 Analytics**: Regional scan tracking integrated via **Firebase Analytics**.
*   **🔐 Authentication**: Secure user sign-in and session management.

## 💻 Tech Stack
*   **Frontend**: HTML, CSS, Vanilla JavaScript
*   **Backend**: Node.js, Express
*   **AI Model**: Google Gemini API
*   **Location Services**: Google Maps API
*   **Analytics**: Firebase
*   **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites
*   Node.js installed on your machine
*   Google Gemini API Key
*   Google Maps API Key
*   Firebase configuration

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/dermai.git
    cd dermai
    ```

2.  Install dependencies for the backend:
    ```bash
    cd backend
    npm install
    ```

3.  Configure Environment Variables:
    Create a `.env` file in the `backend` directory and add your API keys:
    ```env
    GEMINI_API_KEY=your_gemini_api_key
    PORT=3000
    ```

4.  Start the Development Server:
    ```bash
    npm run dev
    ```

5.  Open your browser and navigate to `http://localhost:3000`.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License.
