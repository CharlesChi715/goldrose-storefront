/* eslint-disable @next/next/no-img-element */
/**
 * ROLE OF THIS FILE
 * Homepage module A-4 — Figma node 138:60 "Real Rose Story and MORI Entry"
 * of the VELORIA homepage frame: the real-rose → GoldRose three-step story
 * strip with quote pill, and the MORI gift-finder panel with three path
 * cards. Coordinates/colors are verbatim Figma REST values; the path cards
 * are pixel-exact non-clickable placeholders per the route table.
 */

import { abs } from "@/components/veloria";
import { playfair, playfairSC, notoSC, goudy } from "@/lib/fonts";

export function A4() {
  return (
    // 138:60 — module frame, clips content (left bleed of the ribbon, MORI's tail)
    <div style={{ ...abs(0, 2417, 430, 787), background: "#FFF6EC", overflow: "hidden" }}>
      {/* 160:69 — eyebrow glyph strip (✿ ornaments), placed at its render bounds */}
      <img
        src="/veloria/home/160-69.svg"
        alt="✿   FROM REAL ROSE TO GOLDROSE   ✿"
        width={169}
        height={9}
        style={{ ...abs(130.681, 25.404, 169, 9), display: "block" }}
      />

      {/* 160:70 — story title */}
      <div
        className={playfair.className}
        style={{
          ...abs(46, 52, 338),
          fontSize: 25,
          lineHeight: "30px",
          color: "#3B2F2F",
          fontWeight: 500,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        A Real Rose, Made to Last
      </div>

      {/* 160:71 — story description (wraps to two lines) */}
      <div
        className={notoSC.className}
        style={{
          ...abs(55, 92, 320),
          fontSize: 10,
          lineHeight: "15px",
          color: "#3B2F2F",
          textAlign: "center",
        }}
      >
        Every GoldRose begins with a genuine natural rose, carefully preserved and
        finished as a lasting keepsake.
      </div>

      {/* 160:72/74/76 — three step photos: one shared full-bleed source render
          (160:73, 430x709 at frame origin) shown through small clip windows,
          hence the negative offsets. */}
      <div style={{ ...abs(29, 136, 107, 88), borderRadius: 8, overflow: "hidden" }}>
        <img
          src="/veloria/home/160-73.png"
          alt="Fresh natural pink rose"
          width={430}
          height={709}
          style={{ ...abs(-29, -136, 430, 709), display: "block", maxWidth: "none" }}
        />
      </div>
      <div style={{ ...abs(161, 136, 104, 88), borderRadius: 8, overflow: "hidden" }}>
        <img
          src="/veloria/home/160-73.png"
          alt="Hands carefully holding the preserved rose"
          width={430}
          height={709}
          style={{ ...abs(-161, -136, 430, 709), display: "block", maxWidth: "none" }}
        />
      </div>
      <div style={{ ...abs(291, 136, 108, 88), borderRadius: 8, overflow: "hidden" }}>
        <img
          src="/veloria/home/160-73.png"
          alt="Finished gold-dipped rose in a gift box"
          width={430}
          height={709}
          style={{ ...abs(-291, -136, 430, 709), display: "block", maxWidth: "none" }}
        />
      </div>

      {/* 160:78–80 — step labels */}
      <div
        className={notoSC.className}
        style={{
          ...abs(28, 229, 108),
          fontSize: 8,
          lineHeight: "12px",
          color: "#D4AF37",
          fontWeight: 500,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {"01  REAL ROSE"}
      </div>
      <div
        className={notoSC.className}
        style={{
          ...abs(151, 229, 128),
          fontSize: 8,
          lineHeight: "12px",
          color: "#D4AF37",
          fontWeight: 500,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {"02  CAREFULLY PRESERVED"}
      </div>
      <div
        className={notoSC.className}
        style={{
          ...abs(286, 229, 122),
          fontSize: 8,
          lineHeight: "12px",
          color: "#D4AF37",
          fontWeight: 500,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {"03  FINISHED GOLDROSE"}
      </div>

      {/* 160:81 — story quote pill, served whole as Figma's vector render
          (border + text + ✦ glyphs baked in) */}
      <img
        src="/veloria/home/160-81.svg"
        alt="✦  Real Rose. Carefully Preserved. Made to Last.  ✦"
        width={278}
        height={34}
        style={{ ...abs(76, 255, 278, 34), display: "block" }}
      />

      {/* 162:69 — MORI Gift Finder Panel */}
      <div style={{ ...abs(0, 355, 430, 432), background: "#FFF6EC", overflow: "hidden" }}>
        {/* 162:71 — MORI entry title (three design lines) */}
        <div
          className={playfairSC.className}
          style={{
            ...abs(26, 40, 210, 96),
            fontSize: 24,
            lineHeight: "30px",
            color: "#3B2F2F",
            whiteSpace: "pre-line",
          }}
        >
          {"Hi, I’m MORI,\nLet me show\nyou more."}
        </div>

        {/* 162:72 — MORI entry copy (wraps in a 190px column) */}
        <div
          className={goudy.className}
          style={{ ...abs(26, 144, 190, 40), fontSize: 11, lineHeight: "17px", color: "#3B2F2F" }}
        >
          I&rsquo;ll help you find the right rose for the person and moment you&rsquo;re
          celebrating.
        </div>

        {/* 162:75 — MORI signature */}
        <div
          className={goudy.className}
          style={{
            ...abs(26, 192, 210),
            fontSize: 12,
            lineHeight: "18px",
            color: "#3B2F2F",
            whiteSpace: "nowrap",
          }}
        >
          Choose a path to begin.
        </div>

        {/* 393:150 — Gift Path Card · Find a Gift (selected/dark state) — placeholder */}
        <div
          style={{
            ...abs(21, 226, 285, 64),
            background: "#271C15",
            borderRadius: 11,
            // 1.25px inside stroke + Figma INNER_SHADOW
            boxShadow: "inset 0 0 0 1.25px #D19E40, inset 0 2px 5px rgba(46,28,15,0.18)",
            overflow: "hidden",
          }}
        >
          <img
            src="/veloria/home/393-151.svg"
            alt=""
            width={40}
            height={40}
            style={{ ...abs(12, 12, 40, 40), display: "block" }}
          />
          <div style={{ ...abs(62, 17, 191, 30), overflow: "hidden" }}>
            <div
              className={playfair.className}
              style={{
                ...abs(0, 0, 191),
                fontSize: 14.5,
                lineHeight: "18px",
                color: "#E8BF59",
                fontWeight: 500,
                letterSpacing: 0.5,
                whiteSpace: "nowrap",
              }}
            >
              FIND A GIFT
            </div>
            <div
              className={notoSC.className}
              style={{
                ...abs(0, 18, 191),
                fontSize: 9.5,
                lineHeight: "12px",
                color: "#F0E3CF",
                whiteSpace: "nowrap",
              }}
            >
              Choose by recipient and occasion.
            </div>
          </div>
          <img
            src="/veloria/home/393-158.svg"
            alt=""
            width={10}
            height={18}
            style={{ ...abs(263, 23, 10, 18), display: "block" }}
          />
        </div>

        {/* 394:150 — Gift Path Card · Personalize Your Rose — placeholder */}
        <div
          style={{
            ...abs(21, 296, 310, 64),
            background: "#FFF9F0",
            borderRadius: 11,
            boxShadow: "inset 0 0 0 1px #E3C294, 0px 2px 5px rgba(74,48,26,0.07)",
            overflow: "hidden",
          }}
        >
          <img
            src="/veloria/home/394-151.svg"
            alt=""
            width={42}
            height={40}
            style={{ ...abs(12, 12, 42, 40), display: "block" }}
          />
          <div style={{ ...abs(64, 17, 216, 30), overflow: "hidden" }}>
            <div
              className={playfair.className}
              style={{
                ...abs(0, 0, 216),
                fontSize: 14.5,
                lineHeight: "18px",
                color: "#3B2F2F",
                fontWeight: 500,
                letterSpacing: 0.3,
                whiteSpace: "nowrap",
              }}
            >
              PERSONALIZE YOUR ROSE
            </div>
            <div
              className={notoSC.className}
              style={{
                ...abs(0, 18, 216),
                fontSize: 9.5,
                lineHeight: "12px",
                color: "#4A403B",
                whiteSpace: "nowrap",
              }}
            >
              Add a name, date or personal message.
            </div>
          </div>
          <img
            src="/veloria/home/393-158.svg"
            alt=""
            width={10}
            height={18}
            style={{ ...abs(290, 23, 10, 18), display: "block" }}
          />
        </div>

        {/* 396:150 — Gift Path Card · Explore Our Craft — placeholder */}
        <div
          style={{
            ...abs(21, 366, 335, 64),
            background: "#FFF9F0",
            borderRadius: 11,
            boxShadow: "inset 0 0 0 1px #E3C294, 0px 2px 5px rgba(74,48,26,0.07)",
            overflow: "hidden",
          }}
        >
          <img
            src="/veloria/home/396-151.svg"
            alt=""
            width={40}
            height={40}
            style={{ ...abs(12, 12, 40, 40), display: "block" }}
          />
          <div style={{ ...abs(62, 17, 241, 30), overflow: "hidden" }}>
            <div
              className={playfair.className}
              style={{
                ...abs(0, 0, 241),
                fontSize: 14.5,
                lineHeight: "18px",
                color: "#3B2F2F",
                fontWeight: 500,
                letterSpacing: 0.3,
                whiteSpace: "nowrap",
              }}
            >
              EXPLORE OUR CRAFT
            </div>
            <div
              className={notoSC.className}
              style={{
                ...abs(0, 18, 241),
                fontSize: 9.5,
                lineHeight: "12px",
                color: "#4A403B",
                whiteSpace: "nowrap",
              }}
            >
              See how every real rose is prepared and finished.
            </div>
          </div>
          <img
            src="/veloria/home/393-158.svg"
            alt=""
            width={10}
            height={18}
            style={{ ...abs(313, 23, 10, 18), display: "block" }}
          />
        </div>
      </div>

      {/* 380:242 — pink wave ribbon, bleeds 15px past the left edge (frame clips) */}
      <img
        src="/veloria/home/380-242.png"
        alt=""
        width={445}
        height={82}
        style={{ ...abs(-15, 275, 445, 82), display: "block", maxWidth: "none" }}
      />

      {/* 380:238/239/241 — gold step arrows: 19x0 line nodes whose arrowhead
          bleeds into a 20x8 canvas; placed at their render bounds. Arrows 1 & 2
          overlap at the same spot in the design — kept verbatim. */}
      <img
        src="/veloria/home/380-238.svg"
        alt=""
        width={20}
        height={8}
        style={{ ...abs(138, 174.318, 20, 8), display: "block" }}
      />
      <img
        src="/veloria/home/380-239.svg"
        alt=""
        width={20}
        height={8}
        style={{ ...abs(138, 174.318, 20, 8), display: "block" }}
      />
      <img
        src="/veloria/home/380-241.svg"
        alt=""
        width={20}
        height={8}
        style={{ ...abs(269, 174.318, 20, 8), display: "block" }}
      />

      {/* 380:243 — "—   ✿   —" ornament glyph strip, centered in its 140px text
          box; placed at its render bounds. */}
      <img
        src="/veloria/home/378-235.svg"
        alt=""
        width={98}
        height={23}
        style={{ ...abs(166.347, 318.744, 98, 23), display: "block" }}
      />

      {/* 386:251 — MORI, drawn above the panel and first path card ("Card Overlap");
          right edge runs past x=430, clipped by the module frame. */}
      <img
        src="/veloria/home/386-251.png"
        alt="MORI, the GoldRose gift-box cat mascot holding a gold rose"
        width={237}
        height={237}
        style={{ ...abs(205, 379, 237, 237), display: "block" }}
      />
    </div>
  );
}
