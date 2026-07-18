# mikeside.com

Personal site for mikeside.com — plain HTML/CSS/JS, hosted on Porkbun Static Hosting.

## Structure

```
index.html          Home page
css/style.css       All styles (colors/theme via CSS variables at the top)
js/main.js          Nav + small shared behavior
photos/             Photo galleries (drop optimized images in photos/img/)
videos/             Video pages (YouTube/Vimeo embeds)
blog/               Blog index + one HTML file per post
projects/           Each project gets its own subfolder with an index.html
404.html            Not-found page
```

## Editing

Anything marked `<!-- EDIT ME -->` is placeholder content meant to be personalized.

## Deploying

Porkbun Static Hosting serves whatever is in this repo (connected via the
Porkbun dashboard → domain → Static Hosting → GitHub integration), or upload
the files directly through Porkbun's web editor / FTP. Max 40MB per file —
keep videos on YouTube/Vimeo and embed them.
