from pathlib import Path
import unicodedata


DATA_DIR = Path(__file__).parent / "data"
INPUT_FILE = DATA_DIR / "lieuxculturels.csv"
OUTPUT_FILE = DATA_DIR / "lieuxculturels_no_accents.csv"


def remove_accents(text: str) -> str:
    return "".join(
        character
        for character in unicodedata.normalize("NFD", text)
        if not unicodedata.combining(character)
    )


def main() -> None:
    with INPUT_FILE.open("r", encoding="utf-8-sig", newline="") as source:
        content = source.read()

    with OUTPUT_FILE.open("w", encoding="utf-8", newline="") as destination:
        destination.write(remove_accents(content))

    print(f"Created {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
