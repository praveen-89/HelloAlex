# AI Customer Support Agent - Architecture Diagram

```mermaid
graph TD
    subgraph "User Layer (Browser)"
        A[User Interface - Next.js]
        B[Web Speech API - STT/TTS]
    end

    subgraph "Google Cloud Platform (GCP)"
        subgraph "Cloud Run (Compute)"
            C[Express Backend - Node.js]
        end
        
        subgraph "Services Layer"
            D[Intent Classification]
            E[Sentiment Analysis]
            F[Order/FAQ Database]
        end
    end

    subgraph "AI Layer"
        G[Google Gemini 1.5 Flash]
    end

    A <--> B
    A -- "HTTP Request" --> C
    C -- "Processing" --> D
    C -- "Processing" --> E
    C -- "Data Lookup" --> F
    C -- "Google GenAI SDK" --> G
    G -- "AI Response" --> C
    C -- "JSON Response" --> A
```

### Flow Explanation for Judges:
1. **Input**: User speaks into the microphone (Next.js + Web Speech API).
2. **Processing**: Request hits the **GCP Cloud Run** hosted Express server.
3. **Intelligence**: Backend leverages the **Google Generative AI SDK** to connect with **Gemini 1.5 Flash**.
4. **Context**: Backend enriches the prompt with real-time order data and FAQ context before sending it to Gemini.
5. **Output**: Gemini's response is sent back to the frontend and spoken aloud to the user.
