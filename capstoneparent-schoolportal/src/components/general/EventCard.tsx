import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface EventCardProps {
  title: string
  description: string
  backgroundColor?: string
  imageUrl?: string
}

export default function EventCard({
  title,
  description,
  backgroundColor = "bg-emerald-500",
  imageUrl = "https://images.unsplash.com/photo-1604076850742-4c7221f3101b?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
}: EventCardProps) {
  return (
    <Card className={`relative mx-auto w-full pt-0 overflow-hidden ${backgroundColor}`}>
      <div className="absolute inset-0 z-30 aspect-video opacity-50 mix-blend-color"/>
      <img
        src={imageUrl}
        alt={title}
        title={title}
        className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale"
      />
      <div>
        <CardHeader>
          <CardTitle className="text-white text-2xl line-clamp-2">{title}</CardTitle>
          <CardDescription className="text-white text-[17px] line-clamp-4">{description}</CardDescription>
        </CardHeader>
      </div>
    </Card>
  )
}
