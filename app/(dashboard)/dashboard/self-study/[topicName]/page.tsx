"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTopicByName } from "@/api/auth/profile";
import TopicDetailPageClient from "./TopicDetailPageClient";

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicName = params.topicName as string;
  const decodedTopicName = decodeURIComponent(topicName);

  const [topic, setTopic] = useState<{
    id: number;
    name: string;
    thumbnail: string | null;
    description: string | null;
    sub_id: number;
  } | null>(null);
  const [subtopics, setSubtopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        setLoading(true);
        // Client-side API call, but filtering happens SERVER-SIDE in the backend
        const response = await getTopicByName(decodedTopicName);
        if (response.success && response.data) {
          setTopic(response.data.topic);
          setSubtopics(response.data.subtopics);
        } else {
          setError(response.message || "Topic not found");
        }
      } catch (err) {
        console.error("Error fetching topic:", err);
        setError("Failed to load topic");
      } finally {
        setLoading(false);
      }
    };

    if (decodedTopicName) {
      fetchTopic();
    }
  }, [decodedTopicName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-200">Loading topic...</div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-sm text-slate-200">{error || "Topic not found"}</p>
        <button
          onClick={() => router.back()}
          className="text-xs font-semibold text-amber-300 hover:text-amber-200 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <TopicDetailPageClient topic={topic} subtopics={subtopics} />;
}

