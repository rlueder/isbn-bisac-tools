/**
 * Type definitions for API-related data structures
 */

/**
 * Google Books API response structure
 */
export interface GoogleBooksResponse {
  /** Kind of resource */
  kind: string;
  /** Total number of items found */
  totalItems: number;
  /** Array of book items */
  items?: GoogleBookItem[];
}

/**
 * Google Books API item structure
 */
export interface GoogleBookItem {
  /** Kind of resource */
  kind: string;
  /** Item ID */
  id: string;
  /** ETAG for the item */
  etag: string;
  /** Self link */
  selfLink: string;
  /** Volume information */
  volumeInfo: {
    /** Book title */
    title: string;
    /** Book authors */
    authors?: string[];
    /** Publisher name */
    publisher?: string;
    /** Publication date */
    publishedDate?: string;
    /** Book description */
    description?: string;
    /** Industry identifiers (ISBN, etc.) */
    industryIdentifiers?: {
      /** Type of identifier (ISBN_10, ISBN_13, etc.) */
      type: string;
      /** Identifier value */
      identifier: string;
    }[];
    /** Page count */
    pageCount?: number;
    /** Book categories */
    categories?: string[];
    /** Average rating */
    averageRating?: number;
    /** Rating count */
    ratingsCount?: number;
    /** Maturity rating */
    maturityRating?: string;
    /** Content version */
    contentVersion?: string;
    /** Image links */
    imageLinks?: {
      /** Small thumbnail URL */
      smallThumbnail?: string;
      /** Thumbnail URL */
      thumbnail?: string;
    };
    /** Language code */
    language?: string;
  };
  /** Sale information */
  saleInfo?: {
    /** Country code */
    country: string;
    /** Salability status */
    saleability: string;
    /** Whether the book is for sale */
    isEbook: boolean;
    /** List price */
    listPrice?: {
      /** Amount */
      amount: number;
      /** Currency code */
      currencyCode: string;
    };
    /** Retail price */
    retailPrice?: {
      /** Amount */
      amount: number;
      /** Currency code */
      currencyCode: string;
    };
    /** Buy link */
    buyLink?: string;
  };
  /** Access information */
  accessInfo?: {
    /** Country code */
    country: string;
    /** Viewability status */
    viewability: string;
    /** Whether the book is embeddable */
    embeddable: boolean;
    /** Whether the book has public domain */
    publicDomain: boolean;
    /** Text-to-speech permission */
    textToSpeechPermission: string;
    /** EPUB availability */
    epub: {
      /** Whether EPUB is available */
      isAvailable: boolean;
      /** EPUB download link */
      downloadLink?: string;
    };
    /** PDF availability */
    pdf: {
      /** Whether PDF is available */
      isAvailable: boolean;
      /** PDF download link */
      downloadLink?: string;
    };
    /** Web reader link */
    webReaderLink?: string;
    /** Access view status */
    accessViewStatus: string;
  };
}

/**
 * ISBN lookup response structure
 */
export interface ISBNLookupResponse {
  /** ISBN code */
  isbn: string;
  /** Book title */
  title?: string;
  /** Book authors */
  authors?: string[];
  /** Publication date */
  publishedDate?: string;
  /** Publisher name */
  publisher?: string;
  /** BISAC categories */
  bisacCategories?: {
    /** BISAC code */
    code: string;
    /** BISAC label */
    label: string;
    /** Full path including category */
    path?: string;
  }[];
  /** Error message if lookup failed */
  error?: string;
}

/**
 * Open Library API response structure
 */
export interface OpenLibraryResponse {
  /** ISBN key */
  [isbn: string]: {
    /** Publishers */
    publishers?: string[];
    /** Publication places */
    publish_places?: string[];
    /** Contributors */
    contributions?: string[];
    /** Pagination information */
    pagination?: string;
    /** Book title */
    title: string;
    /** Publication date */
    publish_date?: string;
    /** Publication country */
    publish_country?: string;
    /** Authors */
    authors?: {
      /** Author key */
      key: string;
    }[];
    /** Book subjects */
    subjects?: string[];
    /** Language code */
    language?: string;
  };
}
