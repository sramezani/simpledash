import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { brand, colors } from "@/config/theme";
import { formatPercent } from "@/lib/format";
import type { SiteBlock, WeeklyEmailData } from "./content";

/**
 * The Monday email (docs/SPEC.md sections 14 and 28.1): one block per site. Colours,
 * name and logo come from the theme file as inline styles, because email clients
 * don't support CSS variables.
 */
const c = colors.light;
const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
const muted = { color: c["muted-foreground"], fontSize: "13px", margin: 0 };

function Change({ change }: { change: number | null }) {
  if (change === null) return <span style={{ color: c["muted-foreground"] }}>—</span>;
  if (change === 0) return <span style={{ color: c["muted-foreground"] }}>No change</span>;
  const up = change > 0;
  return (
    <span style={{ color: up ? c.positive : c.negative }}>
      {up ? "↑ Up" : "↓ Down"} {formatPercent(change)}
    </span>
  );
}

function List({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  if (rows.length === 0) return null;
  return (
    <Section style={{ marginTop: "20px" }}>
      <Text style={{ ...muted, marginBottom: "6px" }}>{title}</Text>
      {rows.map((row) => (
        <Row key={row.label} style={{ borderBottom: `1px solid ${c.border}` }}>
          <Column style={{ padding: "6px 0", fontSize: "14px", color: c.foreground }}>
            {row.label}
          </Column>
          <Column align="right" style={{ padding: "6px 0", fontSize: "14px", color: c.foreground }}>
            {row.value}
          </Column>
        </Row>
      ))}
    </Section>
  );
}

/** One site's numbers. With several sites, each block has its own heading and link. */
function Block({ block, several }: { block: SiteBlock; several: boolean }) {
  return (
    <Section style={{ marginTop: several ? "8px" : 0 }}>
      {several ? (
        <Text
          style={{ margin: "16px 0 0", fontSize: "16px", fontWeight: 700, color: c.foreground }}
        >
          {block.siteLabel}
        </Text>
      ) : null}
      <Text style={{ ...muted, marginTop: several ? "2px" : "16px" }}>
        {several ? block.period : `${block.siteLabel} · ${block.period}`}
      </Text>
      {block.summary ? (
        <Text
          style={{
            fontSize: several ? "15px" : "18px",
            lineHeight: several ? "22px" : "26px",
            fontWeight: 600,
            color: c.foreground,
            margin: "6px 0 0",
          }}
        >
          {block.summary}
        </Text>
      ) : null}

      <Section style={{ marginTop: "16px" }}>
        <Row>
          {block.stats.map((s) => (
            <Column key={s.label} style={{ verticalAlign: "top", paddingRight: "8px" }}>
              <Text style={muted}>{s.label}</Text>
              <Text
                style={{
                  margin: "2px 0",
                  fontSize: several ? "20px" : "22px",
                  fontWeight: 700,
                  color: c.foreground,
                }}
              >
                {s.value}
              </Text>
              <Text style={{ margin: 0, fontSize: "12px" }}>
                <Change change={s.change} />
              </Text>
            </Column>
          ))}
        </Row>
      </Section>

      <List title="Top sources" rows={block.sources} />
      <List title="Top pages (views)" rows={block.pages} />
      {block.aiVisitors ? (
        <Text style={{ fontSize: "14px", color: c.foreground, marginTop: "16px" }}>
          {block.aiVisitors} visitors came from AI assistants such as ChatGPT and Perplexity.
        </Text>
      ) : null}

      <Section style={{ marginTop: "20px" }}>
        {several ? (
          <Link
            href={block.dashboard}
            style={{ color: c.primary, fontSize: "14px", fontWeight: 600, textDecoration: "none" }}
          >
            Open the {block.siteLabel} dashboard →
          </Link>
        ) : (
          <Button
            href={block.dashboard}
            style={{
              backgroundColor: c.primary,
              color: c["primary-foreground"],
              borderRadius: "8px",
              padding: "12px 18px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Open your dashboard
          </Button>
        )}
      </Section>
    </Section>
  );
}

export function WeeklyEmail({ data }: { data: WeeklyEmailData }) {
  const several = data.blocks.length > 1;
  return (
    <Html lang="en">
      <Head />
      <Preview>{data.preview}</Preview>
      <Body
        style={{ backgroundColor: c.background, fontFamily: font, margin: 0, padding: "24px 0" }}
      >
        <Container
          style={{
            backgroundColor: c.card,
            border: `1px solid ${c.border}`,
            borderRadius: "12px",
            maxWidth: "560px",
            padding: "28px",
          }}
        >
          <Text style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: c.foreground }}>
            <span style={{ color: c.brand, fontWeight: 800 }}>—</span> {brand.name}
          </Text>
          {several ? (
            <Text style={{ ...muted, marginTop: "16px" }}>
              Last week on your {data.blocks.length} sites
            </Text>
          ) : null}
          {data.blocks.map((block, i) => (
            <Section key={block.dashboard}>
              {several && i > 0 ? (
                <Hr style={{ borderColor: c.border, margin: "24px 0 4px" }} />
              ) : null}
              <Block block={block} several={several} />
            </Section>
          ))}

          <Hr style={{ borderColor: c.border, margin: "28px 0 16px" }} />
          <Text style={{ ...muted, fontSize: "12px", lineHeight: "18px" }}>
            You get this email because the Monday email is on for your {brand.name} account. Numbers
            come from your Google Analytics; visitors who block it aren&apos;t counted.{" "}
            <Link
              href={data.links.settings}
              style={{ color: c["muted-foreground"], textDecoration: "underline" }}
            >
              Email settings
            </Link>{" "}
            ·{" "}
            <Link
              href={data.links.unsubscribe}
              style={{ color: c["muted-foreground"], textDecoration: "underline" }}
            >
              Unsubscribe
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
