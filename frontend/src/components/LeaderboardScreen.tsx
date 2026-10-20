import React, { useEffect, useState } from "react";
import { Loader2, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

import FooterLinks from "./FooterLinks";
import Header from "./Header";
import { request } from "../utils/request";
import type { InfoModalType } from "./InfoModal";

interface LeaderboardEntry {
  id: number;
  name: string;
  score: number;
  createdAt: string;
  sample?: boolean;
}

interface LeaderboardScreenProps {
  onNavigate: (tab: "play" | "leaderboard") => void;
  activeTab: "play" | "leaderboard";
  onOpenInfo: (type: InfoModalType) => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  onNavigate,
  activeTab,
  onOpenInfo,
}) => {
  const { t, i18n } = useTranslation();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    let abortController: AbortController;

    async function fetchLeaderboard() {
      abortController = new AbortController();

      try {
        setLoading(true);
        setError(null);
        const leaderboardEntries = await request<LeaderboardEntry[]>(
          "/api/leaderboard?limit=20",
          { method: "GET", signal: abortController.signal },
        );
        if (!ignore) {
          setEntries(leaderboardEntries);
        }
      } catch (err: unknown) {
        console.error(err);

        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Unknown error occurred while fetching leaderboard data",
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchLeaderboard();

    return () => {
      ignore = true;
      abortController.abort();
    };
  }, []);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(
        i18n.language === "ru" ? "ru-RU" : "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      );
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header onNavigate={onNavigate} activeTab={activeTab} onOpenInfo={onOpenInfo} />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-neutral-100 rounded-full mb-4">
            <Trophy className="text-lush-black" size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-cabinet tracking-tight text-lush-black">
            {t("leaderboard.title")}
          </h1>
          <p className="text-gray-500 text-sm tracking-wide mt-2">
            {t("leaderboard.desc")}
          </p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded text-center text-sm mb-6 font-light">
            {t("leaderboard.offline")}
          </div>
        )}

        <div className="border-2 border-lush-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="animate-spin text-lush-black" size={40} />
              <span className="text-sm font-medium text-gray-500 tracking-widest uppercase">
                {t("leaderboard.loading")}
              </span>
            </div>
          ) : (entries.length === 0 && !error) ? (
            <div className="text-center py-20 text-gray-500 font-light">
              {t("leaderboard.empty")}
            </div>
          ) : (!error) ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-lush-black text-white text-xs uppercase tracking-widest font-semibold border-b border-lush-black">
                  <th className="px-6 py-4 text-center w-20">
                    {t("leaderboard.rank")}
                  </th>
                  <th className="px-6 py-4">{t("leaderboard.name")}</th>
                  <th className="px-6 py-4 text-right pr-12">
                    {t("leaderboard.score")}
                  </th>
                  <th className="px-6 py-4 text-right">
                    {t("leaderboard.date")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lush-gray-border">
                {entries.map((entry, index) => {
                  const rank = index + 1;
                  let rankStyle = "text-gray-600 font-medium";
                  let rowStyle = "hover:bg-neutral-50 transition-colors";

                  if (rank === 1) {
                    rankStyle = "text-yellow-600 font-bold text-lg";
                    rowStyle =
                      "bg-yellow-50/30 hover:bg-yellow-50/50 transition-colors";
                  } else if (rank === 2) {
                    rankStyle = "text-gray-500 font-bold";
                  } else if (rank === 3) {
                    rankStyle = "text-amber-700 font-bold";
                  }

                  return (
                    <tr key={entry.id} className={rowStyle}>
                      <td className={`px-6 py-4 text-center ${rankStyle}`}>
                        {rank}
                      </td>
                      <td className="px-6 py-4 font-semibold text-lush-black text-sm md:text-base">
                        {entry.name}
                        {entry.sample && (
                          <span className="ml-2 rounded border border-yellow-300 bg-yellow-50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-yellow-800">
                            {t("leaderboard.sample")}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-cabinet text-right pr-12 text-sm md:text-base text-lush-black">
                        {entry.score}
                      </td>
                      <td className="px-6 py-4 text-right text-xs md:text-sm text-gray-500 font-light">
                        {formatDate(entry.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
        </div>
      </main>

      <FooterLinks onOpenInfo={onOpenInfo} />
    </div>
  );
};
export default LeaderboardScreen;
