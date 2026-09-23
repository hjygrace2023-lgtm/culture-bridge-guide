import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeading } from "@/components/layout/page-heading";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteHistoryFn,
  getProfileFn,
  listHistoryFn,
  updateProfileFn,
} from "@/lib/account/account.functions";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Your account — CultureLens" },
      { name: "description", content: "Your display name, picture and saved analysis history." },
      { property: "og:title", content: "Your account — CultureLens" },
      { property: "og:description", content: "Manage your profile and review your saved history." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getProfile = useServerFn(getProfileFn);
  const updateProfile = useServerFn(updateProfileFn);
  const listHistory = useServerFn(listHistoryFn);
  const deleteHistory = useServerFn(deleteHistoryFn);

  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => getProfile({}) });
  const history = useQuery({ queryKey: ["history"], queryFn: () => listHistory({}) });

  useEffect(() => {
    if (profile.data?.displayName != null) setName(profile.data.displayName);
  }, [profile.data?.displayName]);

  const save = useMutation({
    mutationFn: (values: { displayName?: string | null; avatarUrl?: string | null }) =>
      updateProfile({ data: values }),
    onSuccess: () => {
      setNotice("Saved.");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const removeEntry = useMutation({
    mutationFn: (id: string) => deleteHistory({ data: { id } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["history"] }),
  });

  async function onPickPicture(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setNotice(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${uid}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: signed, error: signError } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signError) throw signError;
      save.mutate({ avatarUrl: signed.signedUrl });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "The picture couldn't be uploaded.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-10 pt-8 sm:px-8">
      <PageHeading
        eyebrow="Your account"
        title={
          <>
            Profile
            <br />& History
          </>
        }
        aside={
          <button
            type="button"
            onClick={signOut}
            className="font-display text-xs font-bold uppercase tracking-[0.08em] underline underline-offset-4"
          >
            Sign out
          </button>
        }
      />

      <section className="mt-6 flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden border-2 border-foreground bg-muted">
          {profile.data?.avatarUrl ? (
            <img src={profile.data.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-2xl font-extrabold">
              {(name || "?").slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1">
          <Label htmlFor="display-name" className="text-xs font-bold uppercase tracking-[0.08em]">
            Display name
          </Label>
          <Input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mt-1.5"
          />
        </div>
      </section>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" variant="accent" onClick={() => save.mutate({ displayName: name })} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save name
        </Button>
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Change picture
        </Button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPicture} />
      </div>
      {notice && <p className="mt-3 text-xs text-muted-foreground">{notice}</p>}

      <hr className="rule-thick mt-8" />
      <h2 className="mt-5 font-display text-xl font-extrabold tracking-tight">History</h2>

      {history.isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      ) : (history.data?.length ?? 0) === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing yet. Analyses and drafts you make while signed in appear here.
        </p>
      ) : (
        <ul className="mt-4 border-2 border-foreground">
          {history.data?.map((entry, i) => (
            <li
              key={entry.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${i > 0 ? "border-t-2 border-foreground/15" : ""}`}
            >
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold">{entry.title}</p>
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  {entry.kind === "compose" ? "Compose" : "Analyse"} ·{" "}
                  {new Date(entry.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Delete ${entry.title}`}
                onClick={() => removeEntry.mutate(entry.id)}
                className="shrink-0 p-2 text-foreground/60 transition-colors hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
