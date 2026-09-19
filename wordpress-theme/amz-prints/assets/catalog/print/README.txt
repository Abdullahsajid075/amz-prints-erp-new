Print catalog flip-book
=======================
Pages in /pages are rendered from company-profile.pdf
(source: AMZ orange company profile, 52 pages, filenames orrenge-01.jpg …).

To replace with a new PDF:
1. Put the new file here as company-profile.pdf
2. Re-render each page to pages/orrenge-01.jpg, orrenge-02.jpg, ...
   (use a new filename prefix so CDNs cannot keep the old 01.jpg)
3. The WordPress print book loads those image URLs into StPageFlip.
