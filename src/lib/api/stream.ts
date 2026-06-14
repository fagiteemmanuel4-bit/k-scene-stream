import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { decryptor } from "@/lib/vidsrcDecryptor";

/**
 * Server-side function to resolve the raw stream URL using VidSrcDecryptor.
 * This effectively acts as our internal API route.
 */
export const getRawStream = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      tmdbId: z.string(),
      season: z.number().optional(),
      episode: z.number().optional(),
      isTv: z.boolean().default(false),
    })
  )
  .handler(async ({ data }) => {
    try {
      const result = await decryptor.getRawStream(
        data.tmdbId,
        data.isTv,
        data.season ?? 1,
        data.episode ?? 1
      );
      return result;
    } catch (error) {
      console.error("[API] getRawStream error:", error);
      return {
        url: "",
        error: "Failed to resolve stream",
      };
    }
  });
