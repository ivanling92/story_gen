import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

const storyStructures = ["freytag", "hero_journey", "three_act", "dan_harmon", "fichtean", "save_cat", "seven_point"]

const varietyPrompts = [
  "Focus on unique character backgrounds and unexpected plot twists",
  "Emphasize world-building and atmospheric settings",
  "Concentrate on complex relationships and emotional depth",
  "Highlight action-packed sequences and adventure elements",
  "Explore philosophical themes and moral dilemmas",
  "Feature unconventional protagonists and anti-heroes",
  "Include mystery elements and hidden secrets",
  "Showcase diverse cultures and perspectives",
]

const themeVariations = [
  "redemption and second chances",
  "forbidden love and sacrifice",
  "power and corruption",
  "identity and self-discovery",
  "family secrets and legacy",
  "survival against impossible odds",
  "justice and revenge",
  "friendship and betrayal",
]

export async function POST(request: NextRequest) {
  try {
    const { genre, existingTitles } = await request.json()

    if (!genre) {
      return NextResponse.json({ error: "Genre is required" }, { status: 400 })
    }

    const randomVariety = varietyPrompts[Math.floor(Math.random() * varietyPrompts.length)]
    const randomTheme = themeVariations[Math.floor(Math.random() * themeVariations.length)]
    const randomSeed = Math.floor(Math.random() * 10000)

    let prompt = `Generate 5 unique and compelling story ideas for the ${genre} genre. Each story should be suitable for an 8-chapter format and follow one of the classic story structures.

${randomVariety}. Consider themes around ${randomTheme}.

For each story, provide:
1. A captivating title (2-6 words)
2. A compelling summary (2-3 sentences, around 50-80 words)
3. One of these story structures: ${storyStructures.join(", ")}

Make each story distinct and engaging. Focus on unique premises, interesting characters, and compelling conflicts. Ensure the stories would work well as serialized chapters.`

    if (existingTitles && existingTitles.length > 0) {
      prompt += `\n\nIMPORTANT: Avoid creating stories similar to these existing titles: ${existingTitles.join(", ")}. Generate completely different and original ideas.`
    }

    prompt += `\n\nSeed: ${randomSeed}

Format your response as a JSON array with this EXACT structure:
[
  {
    "title": "Story Title",
    "summary": "Brief compelling summary that hooks the reader...",
    "structure": "freytag"
  }
]

CRITICAL: Each object must have exactly these three fields: "title", "summary", and "structure". Do not use any other field names like "styleType" or similar. Return only the JSON array, no additional text.`

    const { text } = await generateText({
      model: "groq/llama-3.1-70b-versatile",
      prompt,
      temperature: 0.9,
    })

    let stories
    try {
      stories = JSON.parse(text)
    } catch (parseError) {
      console.error("Failed to parse AI response:", text)

      // Try to fix common JSON issues and parse again
      try {
        const fixedText = text
          .replace(/styleType:/g, '"structure":') // Fix incorrect field name
          .replace(/,\s*}/g, "}") // Remove trailing commas
          .replace(/}\s*{/g, "},{") // Fix missing commas between objects

        stories = JSON.parse(fixedText)
      } catch (secondParseError) {
        // If still can't parse, try to extract individual stories manually
        try {
          const storyMatches = text.match(/"title":\s*"[^"]+"/g)
          const summaryMatches = text.match(/"summary":\s*"[^"]+"/g)
          const structureMatches = text.match(/(?:"structure"|styleType):\s*"[^"]+"/g)

          if (storyMatches && storyMatches.length > 0) {
            stories = []
            for (let i = 0; i < Math.min(storyMatches.length, 5); i++) {
              const title = storyMatches[i].match(/"title":\s*"([^"]+)"/)?.[1] || `Story ${i + 1}`
              const summary = summaryMatches?.[i]?.match(/"summary":\s*"([^"]+)"/)?.[1] || "An exciting story awaits..."
              const structure =
                structureMatches?.[i]?.match(/(?:"structure"|styleType):\s*"([^"]+)"/)?.[1] ||
                storyStructures[Math.floor(Math.random() * storyStructures.length)]

              stories.push({ title, summary, structure })
            }
          } else {
            throw new Error("Could not extract stories from response")
          }
        } catch (extractError) {
          console.error("Failed to extract stories:", extractError)
          return NextResponse.json({ error: "Failed to generate valid story ideas" }, { status: 500 })
        }
      }
    }

    if (!Array.isArray(stories)) {
      return NextResponse.json({ error: "Invalid story format generated" }, { status: 500 })
    }

    // Clean and validate each story
    const validatedStories = stories.slice(0, 5).map((story, index) => ({
      title: story.title || `Story ${index + 1}`,
      summary: story.summary || "An exciting story awaits...",
      structure: storyStructures.includes(story.structure)
        ? story.structure
        : storyStructures[Math.floor(Math.random() * storyStructures.length)],
    }))

    // Ensure we have exactly 5 stories
    while (validatedStories.length < 5) {
      validatedStories.push({
        title: `Generated Story ${validatedStories.length + 1}`,
        summary: "An exciting story awaits...",
        structure: storyStructures[Math.floor(Math.random() * storyStructures.length)],
      })
    }

    return NextResponse.json({ stories: validatedStories })
  } catch (error) {
    console.error("Error generating titles:", error)
    return NextResponse.json({ error: "Failed to generate story ideas" }, { status: 500 })
  }
}
