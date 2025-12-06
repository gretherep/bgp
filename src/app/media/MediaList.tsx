"use client";
import React from "react";
import { Media } from "../models/media";


interface MediaListProps {
  media: Media[];
  userRole: "user" | "admin";
  onEdit?: (media: Media) => void;
  onDelete?: (id: string) => void;
}

const MediaList: React.FC<MediaListProps> = ({ media, userRole, onEdit, onDelete }) => {
  return (
    <div className="space-y-4">
      {media.map(item => (
        <div key={item.id} className="bg-gray-900 p-4 rounded-lg shadow flex justify-between items-center text-white">
          <div>
            <h3 className="font-bold text-lg">{item.title} ({item.year})</h3>
            <p className="text-gray-300">{item.synopsis}</p>
            <p className="text-sm text-gray-400">{item.genre} | {item.category}</p>
          </div>
          {userRole === "admin" && (
            <div className="space-x-2">
              <button onClick={() => onEdit?.(item)} className="bg-yellow-600 px-2 py-1 rounded hover:bg-yellow-700">Editar</button>
              <button onClick={() => onDelete?.(item.id)} className="bg-red-600 px-2 py-1 rounded hover:bg-red-700">Eliminar</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MediaList;
