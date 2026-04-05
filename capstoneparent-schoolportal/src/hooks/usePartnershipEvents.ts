import { useState, useEffect } from "react";
import type { PartnershipEventItem } from "@/lib/partnershipEvents";
import { partnershipEvents as initialEvents } from "@/lib/partnershipEvents";

const STORAGE_KEY = "partnership_events";

export const usePartnershipEvents = () => {
  const [events, setEvents] = useState<PartnershipEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load events from localStorage or use initial events
    const storedEvents = localStorage.getItem(STORAGE_KEY);
    
    if (storedEvents) {
      try {
        setEvents(JSON.parse(storedEvents));
      } catch (error) {
        console.error("Failed to parse stored events:", error);
        setEvents(initialEvents);
      }
    } else {
      // Initialize with default events
      setEvents(initialEvents);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialEvents));
    }
    
    setIsLoading(false);
  }, []);

  const updateEvents = (newEvents: PartnershipEventItem[]) => {
    setEvents(newEvents);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents));
  };

  const addEvent = (event: Omit<PartnershipEventItem, "id" | "slug">) => {
    const newId = Math.max(...events.map((e) => e.id), 0) + 1;
    const slug = event.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
    
    const newEvent: PartnershipEventItem = {
      ...event,
      id: newId,
      slug,
    };
    
    const updated = [newEvent, ...events];
    updateEvents(updated);
    return newEvent;
  };

  const updateEvent = (id: number, updates: Partial<PartnershipEventItem>) => {
    const updated = events.map((event) =>
      event.id === id ? { ...event, ...updates } : event
    );
    updateEvents(updated);
  };

  const deleteEvent = (id: number) => {
    const updated = events.filter((event) => event.id !== id);
    updateEvents(updated);
  };

  return {
    events,
    isLoading,
    updateEvents,
    addEvent,
    updateEvent,
    deleteEvent,
  };
};
