# madagascar_is_not_only_a_movie

## Introduction

You've almost certainly seen the movie **Madagascar**. But have you ever wondered where the name comes from ? <br>

Before being a movie, Madagascar is above all a country, more specifically an island in the indian ocean. You may be surprised by its size.

<div align="center">
    <img src="ressources/images/image.png" alt="Madagascar location" style="width: 35%;"/>
</div>

With a collective of CS students, we decided to start this project about discovering Madagascar through these interactive maps. 

## Local development
To install locally, setup a web server in order to serve the file:
- python: `python3 -m http.server 8080`
- Use the [httpd docker image](https://hub.docker.com/_/httpd): `docker run -dit --name my-apache-app -p 8080:80 -v "$PWD":/usr/local/apache2/htdocs/ httpd:2.4`
- Use the [http-server](https://www.npmjs.com/package/http-server) npm package

Additional method can be found [here](https://stackoverflow.com/a/21608670/19479836) (Stack Overflow).

## Contributing

You can contribute by opening a ``pull request``. You can create your map in another ``.js`` and add it as an import in the ``index.html``. Do not forget to add a button for your map in the ``.header``.

In your ``.js``, your map should be wrapped in the ``svg .myDataviz`` and if it needs some options, you could add them in the ``div .mapOptions``.
