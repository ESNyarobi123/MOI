import { notFound } from "next/navigation";
import { getLegalDoc, type LegalDocKey } from "@/lib/legal/content";

const allowedDocs = new Set<LegalDocKey>(["terms", "privacy", "cookies"]);

export default async function LegalDocumentPage({
  params
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = await params;
  if (!allowedDocs.has(doc as LegalDocKey)) {
    notFound();
  }

  const legal = getLegalDoc(doc as LegalDocKey);
  const paragraphs = legal.content.split("\n\n");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fff8fb",
        color: "#271528",
        padding: "32px 16px"
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto", fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>
        <h1 style={{ margin: 0, color: "#64246d" }}>{legal.title}</h1>
        <p style={{ color: "#7b6877", marginTop: 8 }}>
          Version {legal.version} • Last updated {legal.lastUpdated}
        </p>
        <section
          style={{
            marginTop: 24,
            background: "#ffffff",
            border: "1px solid #efd1dc",
            borderRadius: 18,
            padding: 20,
            lineHeight: 1.7
          }}
        >
          {paragraphs.map((paragraph) => (
            <p key={paragraph} style={{ whiteSpace: "pre-wrap", marginTop: 0 }}>
              {paragraph}
            </p>
          ))}
        </section>
      </div>
    </main>
  );
}

