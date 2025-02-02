===============
Install Auspice
===============

.. note::
   This is an Auspice-specific installation guide. If you wish to use Nextstrain :doc:`as a whole <docs.nextstrain.org:learn/parts>`, please refer to :doc:`the Nextstrain installation guide <docs.nextstrain.org:install>`.

.. contents::
   :local:

Install dependencies
====================

Auspice is a JavaScript program and requires `Node.js <https://nodejs.org/>`__ to be installed on your system. Refer to ``engines.node`` in `package.json <https://github.com/nextstrain/auspice/blob/-/package.json>`__ for currently supported versions.

We recommend using `Conda <https://docs.conda.io/>`__ to create an environment with a specific version of Node.js. It's possible to use other methods, but these are the instructions for Conda:

.. code:: bash

   conda create -c conda-forge --name auspice nodejs=16
   conda activate auspice

Install Auspice as a user
=========================

.. code:: bash

   npm install --global auspice

If you look at the `release notes <https://docs.nextstrain.org/projects/auspice/en/stable/releases/changelog.html>`__ you can see the changes that have been made to Auspice (see your version of Auspice via ``auspice --version``). To upgrade, you can run

.. code:: bash

   npm update --global auspice

Install Auspice as a developer
==============================

This is useful for debugging, modifying the source code, or using an unpublished feature branch.

.. code:: bash

   # grab the GitHub auspice repo
   git clone https://github.com/nextstrain/auspice.git
   cd auspice

   # install dependencies and make `auspice` available globally
   npm install --global .

Updating Auspice should only require pulling the new version from GitHub - it shouldn't require any ``npm`` commands. You will, however, have to re-build Auspice whenever the client-related code has changed, via ``auspice build``.

Testing if it worked
====================

If installation worked, you should be able to run ``auspice --help``.
