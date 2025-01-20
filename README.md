# Screen Recorder

A modern screen recording application with webcam overlay support and authentication.

## Features

- Screen recording with webcam overlay
- Device selection (webcam and microphone)
- Modern UI with Tailwind CSS
- Real-time preview
- Error handling and loading states
- TypeScript support
- Authentication with Supabase

## Authentication

### Demo Credentials
- Email: `demo@example.com`
- Password: `password`

### Registration
1. Click "Get Started" or navigate to `/register`
2. Enter your email and password (minimum 6 characters)
3. Click "Create account"
4. Check your email for the confirmation link
5. Click the confirmation link to activate your account

### Login
1. Navigate to `/login`
2. Enter your email and password
3. Click "Sign in"
4. You'll be redirected to the recorder page

### Protected Routes
- The recorder page (`/recorder`) requires authentication
- Unauthenticated users will be redirected to login
- Authenticated users will be redirected from auth pages to recorder

## Tech Stack

- Vue 3 with Composition API
- TypeScript
- Tailwind CSS
- Supabase for authentication
- MediaRecorder API
- Canvas API for webcam overlay

## Getting Started

1. Install dependencies:
```bash
yarn
```

2. Start development server:
```bash
yarn dev
```

3. Build for production:
```bash
yarn build
```

## Browser Support

This application uses modern web APIs:
- MediaDevices API
- MediaRecorder API
- Canvas API
- Screen Capture API

Ensure your target browsers support these features.

## Configuration

Key configuration values can be found in:
- `src/features/screen-recorder/constants/index.ts`

## Project Structure

```
src/
├── assets/
│   └── index.css          # Global styles
├── components/
│   └── ui/               # shadcn-vue components
├── features/
│   └── screen-recorder/
│       ├── components/   # Feature components
│       ├── composables/  # Feature logic
│       ├── constants/    # Configuration
│       └── types/        # TypeScript types
├── lib/
│   └── utils.ts         # Utility functions
└── App.vue              # Root component
```

## License

MIT
