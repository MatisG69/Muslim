# Sajda

Compagnon musulman complet : horaires, alarme Fajr (photo du tapis), Coran, tasbih, calendrier hijri, **récitation guidée par IA** (Tarteel-clone).

## Stack

- Next.js 14 (App Router) · React 18 · TypeScript · Tailwind · Framer Motion
- AlAdhan API (horaires + calendrier hijri)
- alquran.cloud API (Coran complet, arabe Uthmani + traduction Hamidullah)
- **Anthropic Claude Haiku 4.5** (vision — détection tapis de prière)
- **OpenAI Whisper** (ASR récitation, par défaut) — alternative HuggingFace possible

## Variables d'environnement

`.env.local` à la racine du projet :

```
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
```

- `ANTHROPIC_API_KEY` : pour la vérification photo tapis (`/api/verify-rug`)
- `OPENAI_API_KEY` : pour la transcription récitation (`/api/transcribe`). Whisper API : ~0,006 $/min, pas de cold start, excellent sur l'arabe.

### Alternative HuggingFace (gratuit mais peu fiable)

Si vous préférez le modèle Tarteel-tuned :

```
TRANSCRIBE_PROVIDER=hf
HF_TOKEN=hf_...
HF_MODEL=tarteel-ai/whisper-base-ar-quran
```

⚠️ HuggingFace Serverless Inference est devenu instable en 2025 pour les modèles custom. Cold starts fréquents, 502/503. Si problèmes, basculez sur OpenAI.

Sur Vercel, ajoutez ces variables dans **Settings → Environment Variables**.

## Démarrage local

```bash
npm install
# placez Adhan.mp3 dans public/
npm run dev
```

http://localhost:3000.

## Routes

- `/` — accueil : prochaine prière + horaires + sunnah du jour + tuile récitation
- `/quran` · `/quran/[surah]` — lecteur Coran (arabe + translittération + français)
- `/recitation` — récitation IA Tarteel-clone
- `/tasbih` — compteur dhikr
- `/calendar` — calendrier hijri ↔ grégorien
- `/settings` — méthode de calcul, angles, madhab, alarme, rappels
- `/api/verify-rug` — proxy Claude Vision
- `/api/transcribe` — proxy HuggingFace Whisper

## Récitation guidée — comment ça marche

1. L'utilisateur tape sur le micro et commence à réciter n'importe quelle sourate
2. Toutes les 4 secondes, un chunk audio part vers `/api/transcribe`
3. HuggingFace renvoie le texte arabe transcrit (modèle Tarteel-tuned)
4. **Phase de détection** : le texte est comparé aux 114 sourates → meilleure correspondance → navigation auto
5. **Phase de lecture** : alignement glissant mot-à-mot contre le texte attendu
6. Le curseur or avance dans le texte, les mots déjà récités passent en émeraude
7. À la première erreur (similarité < 0,7), pause + bandeau « attendu vs entendu »
8. L'utilisateur peut reprendre ou ignorer

### Pipeline ASR

- Capture : `MediaRecorder` rotatif, chunks de 4s (gap ~100ms)
- Format : `audio/webm;codecs=opus` (Chrome/Android), `audio/mp4` (Safari iOS)
- Normalisation arabe : strip tashkeel, fold alif/ya/hamza/ta-marbuta
- Comparaison : Levenshtein word-level avec seuil 0,7
- Cold start HuggingFace : ~30s au 1er chunk, banner d'attente affiché

## Limites connues

- L'alarme Fajr nécessite l'app ouverte (limite navigateur). Empaqueter en Capacitor pour une vraie alarme système — prévu plus tard.
- HuggingFace tier gratuit : rate-limited. Si latence/erreurs récurrentes, basculer vers HF Pro (9 $/mo) ou OpenAI Whisper API.
- Le modèle Tarteel reconnaît mieux les récitations en Tajwid clair. Récitations très rapides ou avec gros bruit ambiant = plus d'erreurs.

## Coûts

- AlAdhan, alquran.cloud, Nominatim : gratuits
- Anthropic Haiku Vision : ~0,001-0,003 $ / photo tapis
- HuggingFace : gratuit jusqu'à la limite, sinon 0,06 $/min audio en Pro
