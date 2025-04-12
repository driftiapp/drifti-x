import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// Configure multer storage
const storage = multer.memoryStorage();

// Define allowed file types with their extensions
const allowedFileTypes = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg', '.jpe', '.jif', '.jfif'],
  'image/png': ['.png', '.apng'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg', '.svgz'],
  'image/tiff': ['.tiff', '.tif'],
  'image/bmp': ['.bmp', '.dib'],
  'image/x-icon': ['.ico', '.cur'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'image/avif': ['.avif'],
  'image/jxl': ['.jxl'],
  'image/x-xcf': ['.xcf'], // GIMP
  'image/x-krita': ['.kra'], // Krita
  'image/x-adobe-dng': ['.dng'], // Adobe Digital Negative
  'image/x-canon-cr2': ['.cr2'], // Canon RAW
  'image/x-nikon-nef': ['.nef'], // Nikon RAW
  'image/x-sony-arw': ['.arw'], // Sony RAW
  'image/x-fuji-raf': ['.raf'], // Fujifilm RAW

  // Development and Version Control
  'application/x-git': ['.gitignore', '.gitmodules', '.gitattributes'],
  'application/x-patch': ['.patch', '.diff'],
  'text/x-gherkin': ['.feature'], // Cucumber
  'text/x-dockerfile': ['Dockerfile'],
  'application/x-docker-compose': ['docker-compose.yml', 'docker-compose.yaml'],
  'text/x-makefile': ['Makefile', '.mk'],
  'text/x-cmake': ['CMakeLists.txt', '.cmake'],
  'application/x-msbuild': ['.csproj', '.vbproj', '.vcxproj'],
  'application/x-gradle': ['.gradle'],
  'text/x-maven-pom': ['pom.xml'],
  'text/x-ant-build': ['build.xml'],

  // Package Management
  'application/x-npm': ['package.json', 'package-lock.json'],
  'application/x-yarn': ['yarn.lock'],
  'application/x-composer': ['composer.json', 'composer.lock'],
  'application/x-pipfile': ['Pipfile', 'Pipfile.lock'],
  'application/x-requirements': ['requirements.txt'],
  'application/x-cargo': ['Cargo.toml', 'Cargo.lock'],
  'application/x-gemfile': ['Gemfile', 'Gemfile.lock'],
  'application/x-podfile': ['Podfile', 'Podfile.lock'],

  // CI/CD and GitHub
  'application/x-github-workflow': ['.github/workflows/**.yml', '.github/workflows/**.yaml'],
  'application/x-github-action': ['action.yml', 'action.yaml'],
  'application/x-jenkins': ['Jenkinsfile'],
  'application/x-gitlab-ci': ['.gitlab-ci.yml'],
  'application/x-travis': ['.travis.yml'],
  'application/x-circleci': ['.circleci/config.yml'],
  'application/x-azure-pipelines': ['azure-pipelines.yml'],

  // GitHub Documentation
  'text/x-readme': ['README.md', 'README.txt', 'README'],
  'text/x-license': ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING'],
  'text/x-contributing': ['CONTRIBUTING.md'],
  'text/x-changelog': ['CHANGELOG.md', 'CHANGES'],
  'text/x-code-of-conduct': ['CODE_OF_CONDUCT.md'],
  'text/x-security': ['SECURITY.md'],
  'text/x-pull-request-template': ['.github/pull_request_template.md'],
  'text/x-issue-template': ['.github/ISSUE_TEMPLATE/**.md'],
  'text/x-funding': ['.github/FUNDING.yml'],
  'text/x-codeowners': ['CODEOWNERS', '.github/CODEOWNERS'],

  // IDE and Editor Config
  'application/x-editorconfig': ['.editorconfig'],
  'application/x-vscode': ['.vscode/settings.json', '.vscode/launch.json'],
  'application/x-prettier': ['.prettierrc', '.prettierrc.js', '.prettierrc.json'],
  'application/x-eslint': ['.eslintrc', '.eslintrc.js', '.eslintrc.json'],
  'application/x-stylelint': ['.stylelintrc', '.stylelintrc.json'],
  'application/x-browserslist': ['.browserslistrc', 'browserslist'],

  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc', '.dot'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls', '.xlt', '.xla'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt', '.pot', '.pps'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/rtf': ['.rtf'],
  'application/epub+zip': ['.epub'],
  'application/x-mobipocket-ebook': ['.mobi', '.prc'],
  'application/vnd.oasis.opendocument.text': ['.odt'],
  'application/vnd.oasis.opendocument.spreadsheet': ['.ods'],
  'application/vnd.oasis.opendocument.presentation': ['.odp'],
  'application/x-latex': ['.latex', '.tex'],
  'application/x-tex': ['.tex'],
  'application/x-iwork-pages-sffpages': ['.pages'], // Apple Pages
  'application/x-iwork-numbers-sffnumbers': ['.numbers'], // Apple Numbers
  'application/x-iwork-keynote-sffkey': ['.key'], // Apple Keynote
  'application/vnd.scribus': ['.sla', '.scd'], // Scribus
  'application/x-pagemaker': ['.pmd', '.pm6', '.p65'], // Adobe PageMaker
  'application/x-quarkxpress': ['.qxd', '.qxt'], // QuarkXPress

  // Text files
  'text/plain': ['.txt', '.text', '.log', '.ini', '.cfg'],
  'text/csv': ['.csv'],
  'text/markdown': ['.md', '.markdown', '.mdown', '.mkd'],
  'text/html': ['.html', '.htm', '.shtml', '.xhtml'],
  'text/xml': ['.xml', '.xsl', '.xsd'],
  'text/css': ['.css', '.scss', '.sass', '.less'],
  'text/javascript': ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx'],
  'application/json': ['.json', '.jsonld', '.map'],
  'application/x-yaml': ['.yml', '.yaml'],
  'application/toml': ['.toml'],
  'text/x-python': ['.py', '.pyw', '.pyc', '.pyo', '.pyd'],
  'text/x-java': ['.java', '.class', '.jar'],
  'text/x-c': ['.c', '.h'],
  'text/x-c++': ['.cpp', '.hpp', '.cc', '.hh'],
  'text/x-csharp': ['.cs'],
  'text/x-ruby': ['.rb', '.rbw'],
  'text/x-php': ['.php', '.phtml', '.php3', '.php4', '.php5', '.phps'],
  'text/x-swift': ['.swift'],
  'text/x-kotlin': ['.kt', '.kts'],
  'text/x-rust': ['.rs', '.rlib'],
  'text/x-go': ['.go'],

  // Audio files
  'audio/mpeg': ['.mp3', '.m2a', '.m3a'],
  'audio/wav': ['.wav', '.wave'],
  'audio/ogg': ['.ogg', '.oga'],
  'audio/midi': ['.midi', '.mid', '.kar'],
  'audio/x-m4a': ['.m4a'],
  'audio/aac': ['.aac'],
  'audio/flac': ['.flac'],
  'audio/webm': ['.weba'],
  'audio/opus': ['.opus'],
  'audio/x-ms-wma': ['.wma'],
  'audio/x-realaudio': ['.ra', '.ram'],
  'audio/x-aiff': ['.aif', '.aiff', '.aifc'],
  'audio/x-dsf': ['.dsf'], // DSD audio
  'audio/x-dff': ['.dff'], // DSD audio
  'audio/x-ape': ['.ape'], // Monkey's Audio
  'audio/x-wavpack': ['.wv'], // WavPack
  'audio/x-musepack': ['.mpc'], // Musepack

  // Video files
  'video/mp4': ['.mp4', '.m4v', '.m4p'],
  'video/x-msvideo': ['.avi'],
  'video/quicktime': ['.mov', '.qt'],
  'video/x-ms-wmv': ['.wmv'],
  'video/webm': ['.webm'],
  'video/ogg': ['.ogv'],
  'video/x-matroska': ['.mkv'],
  'video/x-flv': ['.flv'],
  'video/3gpp': ['.3gp', '.3gpp'],
  'video/3gpp2': ['.3g2', '.3gp2'],
  'video/x-mng': ['.mng'],
  'video/mp2t': ['.ts'],
  'video/mpeg': ['.mpeg', '.mpg', '.mpe', '.m1v', '.m2v'],
  'video/x-m2ts': ['.m2ts'], // Blu-ray BDAV
  'video/vnd.dlna.mpeg-tts': ['.m2t'], // MPEG-2 Transport Stream
  'video/x-dv': ['.dv', '.dif'], // DV video
  'video/x-ivf': ['.ivf'], // Intel Video Format
  'video/x-prores': ['.prores'], // Apple ProRes

  // Archives
  'application/zip': ['.zip', '.zipx'],
  'application/x-rar-compressed': ['.rar'],
  'application/x-7z-compressed': ['.7z'],
  'application/x-tar': ['.tar'],
  'application/gzip': ['.gz', '.gzip'],
  'application/x-bzip2': ['.bz2', '.bz'],
  'application/x-lzip': ['.lz'],
  'application/x-xz': ['.xz'],
  'application/zstd': ['.zst'],
  'application/vnd.android.package-archive': ['.apk'],
  'application/x-iso9660-image': ['.iso'],
  'application/x-debian-package': ['.deb'],
  'application/x-rpm': ['.rpm'],
  'application/x-stuffit': ['.sit', '.sitx'],
  'application/x-alz': ['.alz'],
  'application/x-arj': ['.arj'],
  'application/x-lha': ['.lha', '.lzh'],

  // Fonts
  'font/ttf': ['.ttf'],
  'font/otf': ['.otf'],
  'font/woff': ['.woff'],
  'font/woff2': ['.woff2'],
  'font/eot': ['.eot'],
  'application/vnd.ms-fontobject': ['.eot'],
  'application/x-font-type1': ['.pfa', '.pfb', '.pfm', '.afm'], // PostScript Type 1
  'application/x-font-ghostscript': ['.gsf'], // Ghostscript fonts
  'application/x-font-linux-psf': ['.psf'], // PC Screen Font
  'application/x-font-sunos-news': ['.news'], // SunOS News Font

  // 3D and CAD
  'model/gltf-binary': ['.glb'],
  'model/gltf+json': ['.gltf'],
  'model/stl': ['.stl'],
  'model/obj': ['.obj'],
  'application/x-3ds': ['.3ds'],
  'application/x-dwg': ['.dwg'],
  'application/x-dxf': ['.dxf'],
  'model/vrml': ['.wrl', '.vrml'], // VRML files
  'model/x3d+xml': ['.x3d'], // X3D files
  'application/x-blender': ['.blend'], // Blender
  'application/x-modo': ['.lxo'], // Modo
  'application/x-max': ['.max'], // 3ds Max
  'application/x-maya': ['.ma', '.mb'], // Maya
  'application/x-lightwave-3d': ['.lwo', '.lws'], // Lightwave 3D
  'application/x-cinema-4d': ['.c4d'], // Cinema 4D

  // Scientific and Technical
  'application/x-hdf5': ['.h5', '.hdf5'], // Hierarchical Data Format
  'application/x-matlab-data': ['.mat'], // MATLAB
  'application/x-netcdf': ['.nc', '.cdf'], // NetCDF
  'application/x-mif': ['.mif'], // MapInfo Interchange Format
  'application/x-qgis': ['.qgs'], // QGIS
  'application/x-spss-sav': ['.sav'], // SPSS
  'application/x-stata': ['.dta'], // Stata
  'chemical/x-pdb': ['.pdb'], // Protein Data Bank
  'chemical/x-mol2': ['.mol2'], // Molecular files
  'chemical/x-xyz': ['.xyz'], // XYZ chemical files
};

// File filter to validate file types
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Check if file type is allowed
  if (allowedFileTypes[file.mimetype as keyof typeof allowedFileTypes]) {
    // Get file extension
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

    // Check if file extension matches the allowed extensions for this MIME type
    if (allowedFileTypes[file.mimetype as keyof typeof allowedFileTypes].includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file extension for ${file.mimetype}. Allowed extensions: ${allowedFileTypes[file.mimetype as keyof typeof allowedFileTypes].join(', ')}`,
        ),
      );
    }
  } else {
    const allowedTypes = Object.keys(allowedFileTypes).join(', ');
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes}`));
  }
};

// Configure multer upload with different limits for different file types
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Increased to 10MB for development files
    files: 1, // Only allow one file at a time
  },
});

export { upload };
