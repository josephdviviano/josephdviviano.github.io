// Konami-code-triggered "mode collapse" easter egg.
// On ↑↑↓↓←→←→BA: every image becomes Bliss, every text node becomes
// low-entropy web-slop, every code block becomes overcooked AI code slop.
// A floating "↩ resample" button restores the original distribution.
// Re-entering the code also restores.

(function () {
  const KONAMI = [
    "ArrowUp", "ArrowUp",
    "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight",
    "ArrowLeft", "ArrowRight",
    "b", "a",
  ];

  const BLISS = "/assets/img/bliss.png";

  const WEB_SLOP_SHORT = [
    "All Rights Reserved.",
    "Cookie Policy.",
    "Privacy Policy.",
    "Terms of Service.",
    "Read More.",
    "Click Here.",
    "Subscribe.",
    "Follow Us.",
    "Home.",
    "About Us.",
    "Contact Us.",
    "Copyright © 2024.",
    "Sign up for our newsletter.",
    "As an AI language model,",
    "It's important to note that...",
    "Here are some key points to consider:",
    "5 Things You Didn't Know.",
  ];

  const WEB_SLOP_LONG = [
    "By continuing to use this site, you agree to our Terms of Service and Privacy Policy.",
    "We use cookies to improve your experience. By continuing to use this site, you agree to our Cookie Policy.",
    "In today's fast-paced world, it's more important than ever to stay up-to-date with the latest trends.",
    "This article may contain affiliate links. We may earn a commission if you click on a link and make a purchase.",
    "Sign up for our newsletter to receive the latest news and updates directly to your inbox.",
    "Home | About Us | Contact Us | Privacy Policy | Terms of Service | Cookie Policy | All Rights Reserved.",
  ];

  const NAV_SLOP = ["Home", "About Us", "Contact Us", "Privacy Policy", "Terms", "Cookies"];

  const CODE_SLOP = [
`from abc import ABC, abstractmethod
from typing import Protocol, Optional, List
from dataclasses import dataclass
from enum import Enum
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DivisibilityResult(Enum):
    FIZZ = "Fizz"
    BUZZ = "Buzz"
    FIZZBUZZ = "FizzBuzz"
    NEITHER = "NEITHER"


class DivisibilityRule(Protocol):
    def applies(self, n: int) -> bool: ...
    def get_output(self) -> str: ...


@dataclass
class FizzRule:
    divisor: int = 3
    output: str = "Fizz"

    def applies(self, n: int) -> bool:
        return n % self.divisor == 0

    def get_output(self) -> str:
        return self.output


class FizzBuzzEngine:
    """
    A highly configurable FizzBuzz implementation following SOLID principles.

    This class implements the Strategy pattern to allow for extensible
    divisibility rules, and uses dependency injection for testability.
    """

    def __init__(self, rules: Optional[List[DivisibilityRule]] = None):
        self.rules = rules or [FizzRule()]
        logger.info(f"Initialized FizzBuzzEngine with {len(self.rules)} rules")

    def process(self, n: int) -> str:
        if not isinstance(n, int):
            raise TypeError(f"Expected int, got {type(n).__name__}")
        if n < 1:
            raise ValueError(f"n must be positive, got {n}")
        applicable = [r for r in self.rules if r.applies(n)]
        if not applicable:
            return str(n)
        return "".join(r.get_output() for r in applicable)`,

`from typing import Union, Optional
from decimal import Decimal
import logging
import warnings

logger = logging.getLogger(__name__)

Number = Union[int, float, Decimal]


def add_numbers(
    a: Optional[Number] = None,
    b: Optional[Number] = None,
    *,
    strict: bool = True,
    allow_none: bool = False,
) -> Optional[Number]:
    """
    Safely add two numbers with comprehensive validation.

    Note: For production use with financial data, consider using Decimal
    to avoid floating-point precision issues.
    """
    if a is None or b is None:
        if allow_none:
            warnings.warn("Received None value, returning None")
            return None
        raise ValueError("Both arguments must be provided")

    if strict:
        for name, val in [("a", a), ("b", b)]:
            if not isinstance(val, (int, float, Decimal)):
                raise TypeError(
                    f"Argument '{name}' must be numeric, got {type(val).__name__}"
                )
            if isinstance(val, float) and (val != val):
                raise ValueError(f"Argument '{name}' is NaN")

    try:
        result = a + b
        logger.debug(f"Computed {a} + {b} = {result}")
        return result
    except OverflowError:
        logger.error(f"Overflow adding {a} and {b}")
        raise
    except Exception as e:
        logger.exception("Unexpected error during addition")
        raise RuntimeError(f"Failed to add numbers: {e}") from e`,

`def is_list_empty(lst):
    """
    Determines whether the provided list is empty.

    This function performs multiple validation checks to ensure robust
    behavior across edge cases.
    """
    if lst is None:
        raise ValueError("Input cannot be None. Please provide a valid list.")

    if not isinstance(lst, list):
        if hasattr(lst, '__len__'):
            return len(lst) == 0
        else:
            raise TypeError(
                f"Expected a list, but received {type(lst).__name__}. "
                f"Please pass a list object."
            )

    try:
        length = len(lst)
        if length == 0:
            return True
        elif length > 0:
            return False
        else:
            # This should never happen, but just in case
            return None
    except Exception as e:
        print(f"An error occurred while checking list length: {e}")
        return None`,

`class StringReverser:
    """
    A utility class for reversing strings.

    This class encapsulates the string reversal logic in a reusable,
    testable, and extensible way.
    """

    def __init__(self, preserve_whitespace: bool = True,
                 encoding: str = 'utf-8'):
        self.preserve_whitespace = preserve_whitespace
        self.encoding = encoding
        self._cache = {}

    def reverse(self, input_string: str) -> str:
        """Reverses the input string character by character."""
        if input_string is None:
            raise ValueError("Cannot reverse None")
        if not isinstance(input_string, str):
            raise TypeError(
                f"Expected str, got {type(input_string).__name__}"
            )

        if input_string in self._cache:
            return self._cache[input_string]

        if len(input_string) == 0:
            return ""

        reversed_string = input_string[::-1]
        self._cache[input_string] = reversed_string
        return reversed_string`,

`# Note: This is a basic implementation. For production use, you may want to
# consider additional edge cases, performance optimizations, and more
# comprehensive error handling. The following code demonstrates one possible
# approach, but there are many valid ways to solve this problem.
#
# Please also note that this solution assumes Python 3.8+. For earlier
# versions, some syntax may need to be adjusted.
#
# Disclaimer: Always test code thoroughly before deploying to production.

def add(a, b):
    return a + b  # Note: this assumes both inputs are numeric`,
  ];

  const INLINE_CODE_SLOP = [
    "Optional[Union[int, float, Decimal]]",
    "def add(a: Number = None, b: Number = None, *, strict: bool = True)",
    "Callable[..., Awaitable[Optional[T]]]",
    "logger.debug(f'Computed {a} + {b} = {result}')",
    "raise RuntimeError(f'Failed: {e}') from e",
  ];

  let isCollapsed = false;
  let inputBuffer = [];
  let snapshots = { imgs: [], texts: [], codes: [] };

  const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function genSlop(targetLen) {
    if (targetLen < 4) return targetLen > 0 ? "...".slice(0, targetLen) : "";
    let out = "";
    while (out.length < targetLen) {
      const remaining = targetLen - out.length;
      const pool = remaining > 60 ? WEB_SLOP_LONG : WEB_SLOP_SHORT;
      out += sample(pool) + " ";
    }
    return out.slice(0, targetLen).trimEnd();
  }

  function collapseImages() {
    document.querySelectorAll("img").forEach((img) => {
      if (img.closest("#mode-collapse-restore")) return;
      snapshots.imgs.push({
        el: img,
        src: img.src,
        srcset: img.srcset,
        style: img.getAttribute("style") || "",
      });
      img.removeAttribute("srcset");
      if (img.parentElement && img.parentElement.tagName === "PICTURE") {
        img.parentElement.querySelectorAll("source").forEach((s) => {
          s.dataset._originalSrcset = s.srcset;
          s.srcset = BLISS;
        });
      }
      img.src = BLISS;
      const hue = Math.floor((Math.random() - 0.5) * 80);
      const contrast = (0.8 + Math.random() * 0.4).toFixed(2);
      img.style.objectFit = "cover";
      img.style.filter = `hue-rotate(${hue}deg) contrast(${contrast})`;
    });
  }

  function collapseCode() {
    document.querySelectorAll("pre, code").forEach((el) => {
      if (el.closest("#mode-collapse-restore")) return;
      snapshots.codes.push({ el, html: el.innerHTML });
      const isInline = el.tagName === "CODE" && !el.closest("pre");
      if (isInline) {
        el.textContent = sample(INLINE_CODE_SLOP);
      } else if (el.tagName === "PRE") {
        el.textContent = sample(CODE_SLOP);
      } else {
        el.textContent = sample(CODE_SLOP);
      }
    });
  }

  function collapseText() {
    const SKIP_TAGS = new Set([
      "SCRIPT", "STYLE", "CODE", "PRE", "NOSCRIPT", "MATH", "SVG",
      "TEXTAREA", "INPUT", "BUTTON", "NINJA-KEYS",
    ]);
    const SKIP_CLASS_SUBSTRINGS = ["MathJax", "mathjax", "katex", "mjx-"];

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.textContent || !node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          let p = node.parentElement;
          while (p) {
            if (SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
            if (p.id === "mode-collapse-restore") return NodeFilter.FILTER_REJECT;
            const cls = p.className && typeof p.className === "string" ? p.className : "";
            for (const sub of SKIP_CLASS_SUBSTRINGS) {
              if (cls.indexOf(sub) !== -1) return NodeFilter.FILTER_REJECT;
            }
            p = p.parentElement;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach((node) => {
      snapshots.texts.push({ node, original: node.textContent });
      const original = node.textContent;
      const parent = node.parentElement;
      const parentTag = parent ? parent.tagName : "";
      const isNav = parent && parent.closest("nav, .navbar, .nav-link");
      if (isNav && original.trim().length < 25) {
        node.textContent = sample(NAV_SLOP);
      } else if (/^H[1-6]$/.test(parentTag)) {
        const phrase = sample(["Cookie Policy", "Privacy Policy", "All Rights Reserved", "Terms of Service"]);
        node.textContent = (phrase + " ").repeat(Math.max(1, Math.ceil(original.length / (phrase.length + 1)))).trimEnd();
      } else {
        node.textContent = genSlop(original.length);
      }
    });
  }

  function collapse() {
    if (isCollapsed) return;
    collapseImages();
    collapseCode();
    collapseText();
    showRestoreButton();
    isCollapsed = true;
  }

  function restore() {
    snapshots.imgs.forEach((s) => {
      s.el.src = s.src;
      if (s.srcset) s.el.srcset = s.srcset;
      if (s.style) s.el.setAttribute("style", s.style);
      else s.el.removeAttribute("style");
      if (s.el.parentElement && s.el.parentElement.tagName === "PICTURE") {
        s.el.parentElement.querySelectorAll("source").forEach((src) => {
          if (src.dataset._originalSrcset !== undefined) {
            src.srcset = src.dataset._originalSrcset;
            delete src.dataset._originalSrcset;
          }
        });
      }
    });
    snapshots.codes.forEach((s) => { s.el.innerHTML = s.html; });
    snapshots.texts.forEach((s) => { s.node.textContent = s.original; });
    snapshots = { imgs: [], texts: [], codes: [] };
    const btn = document.getElementById("mode-collapse-restore");
    if (btn) btn.remove();
    isCollapsed = false;
  }

  function showRestoreButton() {
    const btn = document.createElement("button");
    btn.id = "mode-collapse-restore";
    btn.type = "button";
    btn.textContent = "↩ resample";
    btn.style.cssText = [
      "position: fixed",
      "bottom: 20px",
      "right: 20px",
      "z-index: 99999",
      "padding: 10px 16px",
      "background: #ffc600",
      "color: #193549",
      "border: none",
      "border-radius: 4px",
      "font-family: 'JetBrains Mono', monospace",
      "font-size: 13px",
      "font-weight: 600",
      "cursor: pointer",
      "box-shadow: 0 4px 12px rgba(0,0,0,0.3)",
    ].join(";");
    btn.addEventListener("click", restore);
    document.body.appendChild(btn);
  }

  window.addEventListener("keydown", (e) => {
    const target = e.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
      return;
    }
    inputBuffer.push(e.key);
    if (inputBuffer.length > KONAMI.length) {
      inputBuffer.splice(0, inputBuffer.length - KONAMI.length);
    }
    if (inputBuffer.length === KONAMI.length) {
      let match = true;
      for (let i = 0; i < KONAMI.length; i++) {
        if (inputBuffer[i] !== KONAMI[i]) { match = false; break; }
      }
      if (match) {
        inputBuffer = [];
        if (isCollapsed) restore();
        else collapse();
      }
    }
  });
})();
