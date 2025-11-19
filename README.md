# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Codemap: Authentication (Login) Flow

```mermaid
flowchart TD
    A[User opens App] --> B{sessionStorage.isAuthed === 'true'?}
    B -- yes --> C[isAuthed state set true]
    B -- no --> D[Render login form]
    D --> E[handleLogin submits]
    E --> F{Email & password match ADMIN_* constants?}
    F -- yes --> G[setIsAuthed(true) + sessionStorage flag]
    G --> H[useEffect triggers fetchDashboardData]
    F -- no --> I[setError('Invalid credentials')]
    H --> J[/api/data backend]
    J --> K[Collections + status returned]
    K --> L[Dashboard rendered]
    L --> M[handleLogout clears state & sessionStorage]
    M --> D
```

**Key pieces**

1. **Constants & state** – `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and controlled inputs (`email`, `password`) live in `src/App.js`.
2. **Session bootstrap** – On mount, `useEffect` hydrates `isAuthed` from `sessionStorage` to skip repeat logins.
3. **Login handler** – `handleLogin` compares credentials, toggles `isAuthed`, persists the flag, or surfaces errors.
4. **Data gating** – Once `isAuthed` is true, the data-fetch effect runs `fetchDashboardData` (`src/api.js`), which first hits `/api/data` via CRA proxy, then falls back to `http://localhost:5000/api/data`.
5. **Backend** – `server.js` serves `/api/data`, connecting to Postgres (if `DATABASE_URL` is provided) and returning table previews along with status metadata consumed by the UI.
6. **Logout loop** – `handleLogout` resets credentials, clears `sessionStorage`, and routes users back to the login form, closing the loop shown above.

Use this codemap as the source of truth whenever modifying auth logic or extending it with server-side validation.
