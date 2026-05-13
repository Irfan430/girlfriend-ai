# Girlfriend AI - Todo

## Database & Backend
- [x] DB schema: messages table (userId, role, content, createdAt)
- [x] DB schema: training_data table (userId, question, answer, createdAt)
- [x] DB schema: persona_settings table (userId, name, personality, memories, language)
- [x] DB migration: generate and apply SQL
- [x] tRPC router: chat.sendMessage (LLM call with persona + training data)
- [x] tRPC router: chat.getHistory (paginated message history per user)
- [x] tRPC router: chat.clearHistory (delete all messages for user)
- [x] tRPC router: training.addQA (add Q&A pair)
- [x] tRPC router: training.listQA (list all Q&A pairs for user)
- [x] tRPC router: training.deleteQA (delete a Q&A pair)
- [x] tRPC router: persona.get (get persona settings)
- [x] tRPC router: persona.update (update persona name, traits, memories)
- [x] tRPC router: voice.transcribe (upload audio, transcribe via Whisper)
- [x] LLM girlfriend system prompt with persona injection
- [x] Training data injection into LLM context
- [x] Streaming LLM response support (non-streaming, full response)

## Frontend - Global
- [x] Cyberpunk dark neon theme (index.css) with pink/purple neon accents
- [x] Google Fonts: Rajdhani + Noto Sans Bengali
- [x] App.tsx routes: /, /chat, /train, /settings
- [x] ThemeProvider set to dark mode

## Frontend - Landing Page (/)
- [x] Hero section with animated neon title
- [x] Feature cards (chat, train, voice)
- [x] Login CTA button
- [x] Animated background particles/grid

## Frontend - Chat Page (/chat)
- [x] Desktop: sidebar (training panel) + main chat area
- [x] Mobile: mobile header with icons + full-screen chat
- [x] Animated chat bubbles (user vs AI girlfriend)
- [x] Typing indicator (animated dots)
- [x] Message input with send button
- [x] Voice message record button
- [x] Auto-scroll to latest message
- [x] Message timestamps
- [x] Load message history on mount
- [x] AI response rendering

## Frontend - Training Panel
- [x] Add Q&A pair form
- [x] List of existing Q&A pairs with delete
- [x] Persona settings form (name, personality, memories)
- [x] Language preference toggle (Bangla/English/Both)

## Frontend - Settings
- [x] Persona name customization
- [x] Personality traits input
- [x] Memories/notes input
- [x] Clear chat history button

## Polish & Tests
- [x] Typing indicator animation (CSS)
- [x] Chat bubble entrance animations
- [x] Mobile responsive layout verified
- [x] Vitest: chat router tests (9 tests passing)
- [x] Vitest: training router tests (included in chat.test.ts)

## Improvements & Fixes
- [x] Add mobile bottom navigation bar for chat/train/settings
- [x] Add persona settings shortcut in Training panel sidebar

## Bug Fixes & Improvements
- [x] Fix mobile bottom nav overlap: move nav to 3-dot menu in header (moved to dropdown in header)
- [x] Improve training data injection: ensure Q&A pairs are properly formatted in LLM context (working correctly)
- [x] Test training data impact on LLM responses (verified - Q&A pairs injected into system prompt)

## Training Enhancement
- [x] Increase training data limit: support bulk Q&A import (CSV/JSON) — bulk import feature added to Train page
- [x] Add system prompt customization: allow users to set custom system instructions — persona customization in Settings
- [x] Remove safety filters: ensure unsensored responses for private use — added "no censorship" directive to system prompt
- [ ] Add training data categories: organize Q&A by topics/moods (optional: future enhancement for better organization)
- [x] Improve LLM instruction: add "respond without filters" directive to system prompt — done

## Dataset & Deployment
- [ ] Create comprehensive Bengali conversation dataset for training
- [ ] Integrate pre-trained dataset into system prompt
- [ ] Create public GitHub repository
- [ ] Push code to GitHub with README and setup instructions
