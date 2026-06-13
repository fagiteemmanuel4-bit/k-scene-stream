import { useState, useEffect } from "react";
import { X, Star } from "lucide-react";
import eventsData from "../data/events.json";

interface CelebrityEvent {
  id: string;
  name: string;
  date: string;
  image: string;
  message: string;
}

export function CelebrityPopup() {
  const [event, setEvent] = useState<CelebrityEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const today = new Date();
    const mmdd = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // eventsData is an array directly
    const data = eventsData as unknown as CelebrityEvent[];
    const currentEvent = data.find((e) => e.date === mmdd);

    if (currentEvent) {
      const storageKey = `celebrity-event-${currentEvent.id}-${mmdd}`;
      const hasSeen = localStorage.getItem(storageKey);

      if (!hasSeen) {
        setEvent(currentEvent);
        setIsOpen(true);
      }
    }
  }, []);

  const handleClose = () => {
    if (event) {
      const today = new Date();
      const mmdd = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const storageKey = `celebrity-event-${event.id}-${mmdd}`;
      localStorage.setItem(storageKey, "true");
    }
    setIsOpen(false);
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/20 p-2 text-white hover:bg-black/40 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative aspect-[4/5] w-full">
          <img src={event.image} alt={event.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8 text-center text-white">
            <div className="mb-4 flex justify-center gap-2">
              <Star className="h-6 w-6 text-yellow-400 fill-current" />
              <Star className="h-6 w-6 text-yellow-400 fill-current" />
              <Star className="h-6 w-6 text-yellow-400 fill-current" />
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter mb-2">
              {event.name.toUpperCase()}
            </h2>
            <p className="text-sm font-medium text-white/80 leading-relaxed">{event.message}</p>
            <button
              onClick={handleClose}
              className="mt-6 w-full rounded-full bg-primary py-4 text-sm font-black uppercase tracking-widest text-white shadow-lift transition hover:brightness-110"
            >
              Celebrate Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
