"use client"

import { useState } from "react"
import { ChevronDown, Music } from "lucide-react"
import { useInView } from "@/hooks/use-parallax"

const songs = [
  {
    title: "Eliots Theme",
    lyrics: `Intro

Eliot the pistol whipper, eyes dark green and the ladys shiver…
On his donkey, through the country, misery is right where he belongs…

Chorus 1

Bitter sweet surprise, when a man is on his rise.
Ask him for advice he'll show you rhythmic paradise.

Verse 1

He's been to every place explored but he wants more and he wants more, walks right up to heavens door.
„I come in peace my heart is good.", is what he said, but no one really understood.
„I'd like to drink some if i could", And with a bang the angels knocked him down for good.

Chorus 2

Bitter sweet surprise when a man is on his rise.
Ask him for advice, he'll show you rhythmic paradise.
You'll realise, that the world is full of lies.
Apologise, or you will later pay the price.

Verse 2

His story took a sudden end. So he went home and tried to reunite his friends.
He rode his donkey slept in tents. When you're alone no one else has to depend.
At his old farm he jumped the fence. But neither sheep nor cattle, corn or grain was left.

Instrumental Outro`,
  },
  {
    title: "Masturbating Moose",
    lyrics: `Verse 1

Masturbating Moose, I'll hunt you down and show you how to loose.
Masturbating Moose, The moon shines high and I just wanna share my thoughts and cry,
couse' you are confident but brain absent, can't let down a single friend, and I just wanna' be some more like you…

Verse 2

Let me speak to the man in the moon, he's sitting up there lonely anyways.
He's a drunken fool, I know He's bout' to die cause' he's got nothing left to do,
but eating starlights planting moonpines, drinking mars-ale til' the sunlight shines.
And I just wanna' be some more like you…

Chorus

Im searching for the Masturbating Moose….
I'll hunt u down and show you how to loose….

Verse 3

Masturbating Moose, I'll hunt you down and show you how to loose.
Masturbating Moose, The moon shines high and I just wanna share my thoughts and cry,
couse' you are confident but brain absent, can't let down a single friend, and I just wanna' be some more like you…

Chorus

Im searching for the Masturbating Moose….
I'll hunt u down and show you how to loose….`,
  },
  {
    title: "Rear Duplex",
    lyrics: `Verse 1

A splash of red when i found her dead, my eyes hurt bad when I choked her neck all night.
It was in easy fight. Just had to hold her tight.
A splash of blue when I found her shoe outside my room, had to get a broom to clean,
all the shattered glass she leaves, with her attitude.
A splash of green I have never seen one like you, couse' it's way to hard to,
put all the effort in…

Chorus

Why did you leave me in a trap?
It's hard to feel some when You're dead…
I keep the dagger in my back…
Rear duplex pulls I take it back…
back… back…

Verse 2

Under the trees with the bees humming songs about you, but it's way to loud to, make sure you're alright.
Another day but I spent the night without you, couse' I'm never allowed to, lay down by your side.
I feel so blind couse' I've never seen one like you, couse it's so hard to to do so, and I don't want to,
put all the effort in…

Chorus

Why did you leave me in a trap?
It's hard to feel some when You're dead…
I keep the dagger in my back…
Rear duplex pulls I take it back…
back… back…

Instrumental Bridge

End Chorus

Why did you leave me in a trap?
It's hard to feel some when You're dead…
I keep the dagger in my back…
Rear duplex pulls I take it back…
back… back… back… back…`,
  },
]

export function LyricsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { ref: headerRef, isInView: headerInView } = useInView(0.2)

  return (
    <section id="lyrics" className="relative overflow-hidden px-6 py-28 md:py-36" style={{ backgroundColor: "#050505" }}>
      {/* Accent glow */}
      <div
        className="absolute top-1/2 right-0 h-[600px] w-[400px] -translate-y-1/2 opacity-5 blur-[150px]"
        style={{ backgroundColor: "#e63946" }}
      />

      <div className="relative mx-auto max-w-4xl">
        {/* Section header */}
        <div
          ref={headerRef}
          className={`mb-20 transition-all duration-1000 ease-out ${
            headerInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <p className="mb-3 font-mono text-[11px] tracking-[0.4em] uppercase" style={{ color: "#e63946" }}>
            Texte
          </p>
          <h2 className="text-5xl font-black uppercase tracking-tight md:text-6xl lg:text-7xl" style={{ color: "#fff" }}>
            Lyrics
          </h2>
        </div>

        {/* Song list */}
        <div className="flex flex-col">
          {songs.map((song, index) => {
            const isOpen = openIndex === index
            return (
              <SongItem
                key={song.title}
                song={song}
                index={index}
                isOpen={isOpen}
                onToggle={() => setOpenIndex(isOpen ? null : index)}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}

function SongItem({
  song,
  index,
  isOpen,
  onToggle,
}: {
  song: { title: string; lyrics: string }
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  const { ref, isInView } = useInView(0.1)

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isInView ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"
      }`}
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        transitionDelay: `${index * 100}ms`,
      }}
    >
      <button
        onClick={onToggle}
        className="group flex w-full items-center justify-between py-7 md:py-9"
      >
        <div className="flex items-center gap-6">
          <span
            className="flex h-10 w-10 items-center justify-center font-mono text-xs transition-all duration-300"
            style={{
              color: isOpen ? "#050505" : "#e63946",
              backgroundColor: isOpen ? "#e63946" : "transparent",
              border: `1px solid ${isOpen ? "#e63946" : "rgba(230,57,70,0.3)"}`,
            }}
          >
            {isOpen ? <Music size={14} /> : String(index + 1).padStart(2, "0")}
          </span>
          <h3
            className="text-left text-xl font-black uppercase tracking-tight transition-all duration-300 md:text-2xl lg:text-3xl"
            style={{ color: isOpen ? "#e63946" : "#fff" }}
          >
            {song.title}
          </h3>
        </div>
        <ChevronDown
          size={20}
          className="flex-shrink-0 transition-all duration-300"
          style={{
            color: "#e63946",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      <div
        className="grid transition-all duration-500 ease-out"
        style={{
          gridTemplateRows: isOpen ? "1fr" : "0fr",
        }}
      >
        <div className="overflow-hidden">
          <div
            className="pb-8 pl-16 md:pl-[4.5rem]"
            style={{ borderLeft: "2px solid rgba(230,57,70,0.3)" }}
          >
            <pre
              className="whitespace-pre-wrap font-sans text-sm leading-loose md:text-base"
              style={{ color: "#999" }}
            >
              {song.lyrics}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
