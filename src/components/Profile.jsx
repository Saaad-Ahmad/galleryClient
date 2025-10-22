import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../config";
import "./profile.css";

/* --- ZoomableImage Component --- */
const ZoomableImage = ({ imageUrl }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.1 : 0.9;
    setScale((s) => Math.max(1, Math.min(4, s * factor)));
  };

  const handleMouseDown = (e) => {
    if (scale === 1) return;
    e.preventDefault();
    setIsDragging(true);
    setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  });

  return (
    <div
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      className="w-full flex justify-center items-center relative overflow-hidden touch-none"
      style={{
        cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <img
        src={imageUrl}
        alt="Zoomable"
        draggable={false}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transition: isDragging ? "none" : "transform 0.25s ease",
          maxHeight: "75vh",
          maxWidth: "90vw",
          objectFit: "contain",
          userSelect: "none",
        }}
      />

      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setScale((s) => Math.min(4, s + 0.25));
          }}
          className="bg-white px-3 py-1 rounded-lg shadow text-lg hover:bg-gray-200"
        >
          +
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setScale((s) => Math.max(1, s - 0.25));
            if (scale <= 1.1) setOffset({ x: 0, y: 0 });
          }}
          className="bg-white px-3 py-1 rounded-lg shadow text-lg hover:bg-gray-200"
        >
          −
        </button>
      </div>
    </div>
  );
};

/* --- Profile Component --- */
const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewPhoto, setViewPhoto] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/photos/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setPhotos(res.data.photos || []);
      } catch (err) {
        console.error(err);
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/");
      }
    };

    fetchProfile();
  }, [navigate, token]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Please select a photo!");

    const formData = new FormData();
    formData.append("photo", selectedFile);

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/photos/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setPhotos((prev) => [res.data.photo, ...prev]);
      setSelectedFile(null);
      alert("Photo uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await axios.post(`${BASE_URL}/photos/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setUser((prev) => ({ ...prev, avatar: res.data.avatar }));
      alert("Avatar updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Avatar upload failed.");
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm("Delete this photo?")) return;

    try {
      await axios.delete(`${BASE_URL}/photos/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPhotos((prev) => prev.filter((photo) => photo._id !== photoId));
      if (viewPhoto && viewPhoto._id === photoId) setViewPhoto(null);
      alert("✅ Photo deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete photo.");
    }
  };

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const fileName = url.split("/").pop().split("?")[0];
      link.download = fileName || "photo.jpg";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error(err);
      alert("Failed to download photo.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-30 backdrop-blur-lg bg-opacity-95">
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-12 h-12 rounded-full object-cover border"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
              ?
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold text-blue-600">
              {user?.username || "Loading..."}
            </h1>
            <label className="text-sm text-blue-500 cursor-pointer hover:underline">
              Change Avatar
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
        >
          Logout
        </button>
      </div>

      {/* Upload Section */}
      <div className="max-w-lg mx-auto mt-10 bg-white p-6 rounded-2xl shadow-md text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Upload a New Photo
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-blue-400 rounded-xl p-6 hover:bg-blue-50 transition">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer text-blue-600 font-medium"
            >
              {selectedFile ? selectedFile.name : "Click to select a photo"}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
          {loading && (
            <p className="text-blue-500 text-sm animate-pulse">
              Please wait...
            </p>
          )}
        </form>
      </div>

      {/* Gallery Section */}
      <div className="max-w-6xl mx-auto mt-10 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {photos.length > 0 ? (
          photos.map((photo) => (
            <div
              key={photo._id}
              className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
            >
              <img
                src={photo.url}
                alt="Uploaded"
                className="object-cover w-full h-56 group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                onClick={() => setViewPhoto(photo)}
              />

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewPhoto(photo);
                  }}
                  className="bg-white/90 text-gray-800 px-3 py-1 rounded-md font-medium hover:bg-white transition"
                >
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(photo.url);
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded-md font-medium hover:bg-blue-700 transition"
                >
                  Download
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(photo._id);
                  }}
                  className="bg-red-500 text-white px-3 py-1 rounded-md font-medium hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center col-span-full text-gray-500">
            No photos uploaded yet.
          </p>
        )}
      </div>

      {/* Full Photo Modal */}
      {viewPhoto && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center overflow-y-auto p-4 z-50 animate-fadeIn"
          onClick={() => setViewPhoto(null)}
        >
          <div
            className="relative bg-white rounded-xl p-4 md:p-6 max-w-4xl w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <ZoomableImage imageUrl={viewPhoto.url} />

            <div className="flex justify-between items-center mt-6 border-t pt-4">
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(viewPhoto.url);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Download
                </button>

                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleDelete(viewPhoto._id);
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewPhoto(null);
                }}
                className="text-gray-500 hover:text-gray-800 text-xl font-semibold"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
