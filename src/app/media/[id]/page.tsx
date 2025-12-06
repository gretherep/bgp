"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
}

interface MediaDetail {
  id: string;
  title: string;
  description: string;
  media_url: string;
  thumbnail_url?: string;
  created_at: string;
}

export default function MediaDetailPage() {
  const pathname = usePathname();
  const mediaId = pathname.split("/").pop() || "";
  const [media, setMedia] = useState<MediaDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [postingComment, setPostingComment] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [postingRating, setPostingRating] = useState(false);

  useEffect(() => {
    const fetchMediaAndComments = async () => {
      setLoading(true);
      // Fetch media item
      const { data: mediaData, error: mediaError } = await supabase
        .from("media_items")
        .select("id, title, description, media_url, thumbnail_url, created_at")
        .eq("id", mediaId)
        .single();

      if (mediaError) {
        console.error("Failed to fetch media:", mediaError);
        setLoading(false);
        return;
      }
      setMedia(mediaData);

      // Fetch comments with usernames via joining users table
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select(`
          id,
          user_id,
          content,
          created_at,
          users!inner(username)
        `)
        .eq("media_id", mediaId)
        .order("created_at", { ascending: true });

      if (commentsError) {
        console.error("Failed to fetch comments:", commentsError);
        setLoading(false);
        return;
      }

      // Map to include username in comment
      const mappedComments = commentsData?.map((c: any) => ({
        id: c.id,
        user_id: c.user_id,
        content: c.content,
        created_at: c.created_at,
        username: c.users?.username || "Unknown",
      }));

      setComments(mappedComments || []);

      // Fetch average rating and user's rating
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("ratings")
        .select("rating, user_id")
        .eq("media_id", mediaId);

      if (ratingsError) {
        console.error("Failed to fetch ratings:", ratingsError);
      } else if (ratingsData && ratingsData.length > 0) {
        const total = ratingsData.reduce((sum, r: any) => sum + r.rating, 0);
        const avgRating = total / ratingsData.length;
        setRating(avgRating);

        // Check if current user has rated
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const userRate = ratingsData.find((r: any) => r.user_id === user.id);
          setUserRating(userRate ? userRate.rating : null);
        }
      }

      setLoading(false);
    };

    fetchMediaAndComments();
  }, [mediaId]);

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    setPostingComment(true);

    // Get user session to get user id
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in to post comments.");
      setPostingComment(false);
      return;
    }

    const { error } = await supabase.from("comments").insert({
      media_id: mediaId,
      user_id: user.id,
      content: commentText.trim(),
    });

    if (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment.");
    } else {
      setCommentText("");
      // Refresh comments
      setComments((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          user_id: user.id,
          content: commentText.trim(),
          created_at: new Date().toISOString(),
          username: user.user_metadata?.username || "You",
        },
      ]);
    }

    setPostingComment(false);
  };

  const handleRating = async (newRating: number) => {
    if (postingRating) return;

    setPostingRating(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in to rate media.");
      setPostingRating(false);
      return;
    }

    // Upsert rating (update if exists, insert if not)
    const { error } = await supabase
      .from("ratings")
      .upsert(
        [
          {
            media_id: mediaId,
            user_id: user.id,
            rating: newRating,
          },
        ],
        { onConflict: "media_id,user_id" }
      );

    if (error) {
      console.error("Error posting rating:", error);
      alert("Failed to submit rating.");
    } else {
      setUserRating(newRating);
      // Update average rating locally (simple recalculation omitted for brevity)
      setRating((prev) => (prev ? (prev + newRating) / 2 : newRating));
    }

    setPostingRating(false);
  };

  if (loading) {
    return <div className="p-8 max-w-4xl mx-auto">Loading media details...</div>;
  }

  if (!media) {
    return <div className="p-8 max-w-4xl mx-auto">Media item not found.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-4">{media.title}</h1>
      <div className="mb-6">
        <video
          src={media.media_url}
          controls
          className="w-full max-h-[500px] rounded-lg"
        />
      </div>
      <p className="mb-8 text-gray-700">{media.description}</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Rating</h2>
        <div className="flex items-center space-x-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRating(star)}
              disabled={postingRating}
              className={`text-3xl ${
                userRating && userRating >= star
                  ? "text-yellow-400"
                  : "text-gray-300"
              } hover:text-yellow-500`}
            >
              &#9733;
            </button>
          ))}
          <span className="ml-2 text-gray-700">
            Average: {rating.toFixed(1)} / 5
          </span>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Comments</h2>
        <div className="mb-4">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={4}
            placeholder="Write a comment..."
            className="w-full p-3 border rounded-md resize-none"
            disabled={postingComment}
          />
          <button
            onClick={handleCommentSubmit}
            disabled={postingComment}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {postingComment ? "Posting..." : "Post Comment"}
          </button>
        </div>

        {comments.length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="border p-3 rounded-md">
                <p className="font-semibold">{comment.username}</p>
                <p>{comment.content}</p>
                <p className="text-xs text-gray-500">
                  {new Date(comment.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
