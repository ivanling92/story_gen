"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Sparkles, Wand2 } from "lucide-react"
import { useRouter } from "next/navigation"

const genres = [
  {
    id: "fantasy",
    name: "Fantasy",
    description: "Magical worlds, mythical creatures, and epic adventures",
    icon: "🏰",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    id: "sci-fi",
    name: "Science Fiction",
    description: "Future technology, space exploration, and alien worlds",
    icon: "🚀",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "mystery",
    name: "Mystery",
    description: "Puzzles to solve, secrets to uncover, and clues to follow",
    icon: "🔍",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  {
    id: "romance",
    name: "Romance",
    description: "Love stories, relationships, and emotional journeys",
    icon: "💕",
    color: "bg-pink-100 text-pink-800 border-pink-200",
  },
  {
    id: "adventure",
    name: "Adventure",
    description: "Thrilling quests, daring expeditions, and heroic journeys",
    icon: "⛰️",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    id: "horror",
    name: "Horror",
    description: "Spine-chilling tales, supernatural encounters, and dark mysteries",
    icon: "👻",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  {
    id: "historical",
    name: "Historical Fiction",
    description: "Stories set in the past, bringing history to life",
    icon: "🏛️",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    id: "thriller",
    name: "Thriller",
    description: "High-stakes suspense, danger, and heart-pounding action",
    icon: "⚡",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
]

export default function GenreSelection() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const router = useRouter()

  const handleGenreSelect = (genreId: string) => {
    setSelectedGenre(genreId)
  }

  const handleContinue = () => {
    if (selectedGenre) {
      router.push(`/titles?genre=${selectedGenre}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-3 bg-indigo-100 rounded-full">
            <BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
          <Sparkles className="w-6 h-6 text-purple-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Storybook</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Choose your favorite genre and let AI craft a personalized story just for you
        </p>
      </div>

      {/* Genre Selection */}
      <div className="px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            What kind of story would you like to read?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {genres.map((genre) => (
              <Card
                key={genre.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedGenre === genre.id ? "ring-2 ring-indigo-500 shadow-lg" : "hover:shadow-md"
                }`}
                onClick={() => handleGenreSelect(genre.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{genre.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{genre.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{genre.description}</CardDescription>
                  {selectedGenre === genre.id && (
                    <Badge className="mt-3 bg-indigo-100 text-indigo-800 border-indigo-200">Selected</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Continue Button */}
          <div className="text-center">
            <Button
              onClick={handleContinue}
              disabled={!selectedGenre}
              size="lg"
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              Generate Story Ideas
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
