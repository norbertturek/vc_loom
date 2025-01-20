# Screen Recorder

A Vue 3 screen recording application with webcam overlay support.

## Features

- Screen recording with webcam picture-in-picture
- Device selection for webcam and microphone
- Modern UI with shadcn-vue components
- Real-time webcam preview
- Error handling and loading states
- TypeScript support

## Tech Stack

- Vue 3 with Composition API
- TypeScript
- Tailwind CSS
- shadcn-vue for UI components
- MediaRecorder API for recording
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
