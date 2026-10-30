# Class gallery

Add a student piece without last names.

1. Export a photo or drawing as a small JPG, PNG, or SVG. Keep it under about 1 MB.
2. Save it in `gallery/images/` with a simple file name, such as `am-stand.svg`.
3. Add an object to `gallery/gallery.json`:

```json
{
  "id": "am-stand",
  "name": "A.M.",
  "title": "Phone stand under 20 g",
  "challenge": "Light phone stand",
  "image": "images/am-stand.svg",
  "blurb": "One sentence about the print."
}
```

Use a first name or initials only. Do not add a last name, a face photo, or a school ID.

Votes are stored in each browser with `localStorage`. They do not sync between computers. Export is not required for the sample entries.

The three starter images are drawings, not photos of students.
