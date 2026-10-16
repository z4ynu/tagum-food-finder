export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  catalog: {
    Tables: {
      catalog_release_batches: {
        Row: {
          batch_id: string;
          release_id: string;
        };
        ComputedFields: never;
        Insert: {
          batch_id: string;
          release_id: string;
        };
        Update: {
          batch_id?: string;
          release_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "catalog_release_batches_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: true;
            referencedRelation: "import_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "catalog_release_batches_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "catalog_releases";
            referencedColumns: ["id"];
          },
        ];
      };
      catalog_release_moderation_decisions: {
        Row: {
          moderation_decision_id: string;
          release_id: string;
        };
        ComputedFields: never;
        Insert: {
          moderation_decision_id: string;
          release_id: string;
        };
        Update: {
          moderation_decision_id?: string;
          release_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "catalog_release_moderation_decision_moderation_decision_id_fkey";
            columns: ["moderation_decision_id"];
            isOneToOne: true;
            referencedRelation: "moderation_decisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "catalog_release_moderation_decisions_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "catalog_releases";
            referencedColumns: ["id"];
          },
        ];
      };
      catalog_release_places: {
        Row: {
          canonical_name: string;
          category_label: string;
          category_slug: string;
          craving_slugs: string[];
          cuisine_labels: string[];
          display_address: string | null;
          maximum_centavos: number | null;
          minimum_centavos: number | null;
          occasion_slugs: string[];
          place_id: string;
          place_slug: string;
          point: unknown;
          price_confidence: string | null;
          price_current_through: string | null;
          price_tier: Database["catalog"]["Enums"]["price_tier"] | null;
          published_at: string;
          release_id: string;
          source_attribution: string | null;
          source_label: string;
          verification_state: Database["catalog"]["Enums"]["verification_state"];
        };
        ComputedFields: never;
        Insert: {
          canonical_name: string;
          category_label: string;
          category_slug: string;
          craving_slugs?: string[];
          cuisine_labels?: string[];
          display_address?: string | null;
          maximum_centavos?: number | null;
          minimum_centavos?: number | null;
          occasion_slugs?: string[];
          place_id: string;
          place_slug: string;
          point: unknown;
          price_confidence?: string | null;
          price_current_through?: string | null;
          price_tier?: Database["catalog"]["Enums"]["price_tier"] | null;
          published_at?: string;
          release_id: string;
          source_attribution?: string | null;
          source_label: string;
          verification_state: Database["catalog"]["Enums"]["verification_state"];
        };
        Update: {
          canonical_name?: string;
          category_label?: string;
          category_slug?: string;
          craving_slugs?: string[];
          cuisine_labels?: string[];
          display_address?: string | null;
          maximum_centavos?: number | null;
          minimum_centavos?: number | null;
          occasion_slugs?: string[];
          place_id?: string;
          place_slug?: string;
          point?: unknown;
          price_confidence?: string | null;
          price_current_through?: string | null;
          price_tier?: Database["catalog"]["Enums"]["price_tier"] | null;
          published_at?: string;
          release_id?: string;
          source_attribution?: string | null;
          source_label?: string;
          verification_state?: Database["catalog"]["Enums"]["verification_state"];
        };
        Relationships: [
          {
            foreignKeyName: "catalog_release_places_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "catalog_release_places_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "catalog_releases";
            referencedColumns: ["id"];
          },
        ];
      };
      catalog_releases: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          previous_release_id: string | null;
          published_at: string | null;
          published_by: string | null;
          release_number: number;
          rollback_target_id: string | null;
          validation_result: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          previous_release_id?: string | null;
          published_at?: string | null;
          published_by?: string | null;
          release_number?: never;
          rollback_target_id?: string | null;
          validation_result: NonNullable<Json>;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          previous_release_id?: string | null;
          published_at?: string | null;
          published_by?: string | null;
          release_number?: never;
          rollback_target_id?: string | null;
          validation_result?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "catalog_releases_previous_release_id_fkey";
            columns: ["previous_release_id"];
            isOneToOne: false;
            referencedRelation: "catalog_releases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "catalog_releases_rollback_target_id_fkey";
            columns: ["rollback_target_id"];
            isOneToOne: false;
            referencedRelation: "catalog_releases";
            referencedColumns: ["id"];
          },
        ];
      };
      city_boundaries: {
        Row: {
          boundary: unknown;
          created_at: string;
          effective_from: string;
          effective_to: string | null;
          id: string;
          is_current: boolean;
          name: string;
          slug: string;
          source_checksum: string;
          source_id: string;
          source_version: string;
        };
        ComputedFields: never;
        Insert: {
          boundary: unknown;
          created_at?: string;
          effective_from: string;
          effective_to?: string | null;
          id?: string;
          is_current?: boolean;
          name: string;
          slug: string;
          source_checksum: string;
          source_id: string;
          source_version: string;
        };
        Update: {
          boundary?: unknown;
          created_at?: string;
          effective_from?: string;
          effective_to?: string | null;
          id?: string;
          is_current?: boolean;
          name?: string;
          slug?: string;
          source_checksum?: string;
          source_id?: string;
          source_version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "city_boundaries_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      external_identifiers: {
        Row: {
          created_at: string;
          entity_id: string;
          entity_type: string;
          external_key: string;
          id: string;
          source_id: string;
          source_record_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          entity_id: string;
          entity_type: string;
          external_key: string;
          id?: string;
          source_id: string;
          source_record_id?: string | null;
        };
        Update: {
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          external_key?: string;
          id?: string;
          source_id?: string;
          source_record_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "external_identifiers_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "external_identifiers_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "external_identifiers_source_record_id_fkey";
            columns: ["source_record_id"];
            isOneToOne: false;
            referencedRelation: "source_records";
            referencedColumns: ["id"];
          },
        ];
      };
      field_provenance: {
        Row: {
          accepted_at: string;
          accepted_by: string | null;
          accepted_value_hash: string;
          confidence: string;
          entity_id: string;
          entity_type: string;
          field_path: string;
          id: string;
          moderation_decision_id: string | null;
          review_due_at: string | null;
          source_record_id: string | null;
          superseded_by_id: string | null;
          valid_from: string;
          valid_to: string | null;
          verification_state: Database["catalog"]["Enums"]["verification_state"];
        };
        ComputedFields: never;
        Insert: {
          accepted_at?: string;
          accepted_by?: string | null;
          accepted_value_hash: string;
          confidence: string;
          entity_id: string;
          entity_type: string;
          field_path: string;
          id?: string;
          moderation_decision_id?: string | null;
          review_due_at?: string | null;
          source_record_id?: string | null;
          superseded_by_id?: string | null;
          valid_from?: string;
          valid_to?: string | null;
          verification_state: Database["catalog"]["Enums"]["verification_state"];
        };
        Update: {
          accepted_at?: string;
          accepted_by?: string | null;
          accepted_value_hash?: string;
          confidence?: string;
          entity_id?: string;
          entity_type?: string;
          field_path?: string;
          id?: string;
          moderation_decision_id?: string | null;
          review_due_at?: string | null;
          source_record_id?: string | null;
          superseded_by_id?: string | null;
          valid_from?: string;
          valid_to?: string | null;
          verification_state?: Database["catalog"]["Enums"]["verification_state"];
        };
        Relationships: [
          {
            foreignKeyName: "field_provenance_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "field_provenance_moderation_decision_id_fkey";
            columns: ["moderation_decision_id"];
            isOneToOne: false;
            referencedRelation: "moderation_decisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "field_provenance_source_record_id_fkey";
            columns: ["source_record_id"];
            isOneToOne: false;
            referencedRelation: "source_records";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "field_provenance_superseded_by_id_fkey";
            columns: ["superseded_by_id"];
            isOneToOne: false;
            referencedRelation: "field_provenance";
            referencedColumns: ["id"];
          },
        ];
      };
      import_batch_records: {
        Row: {
          batch_id: string;
          boundary_result: string;
          content_changed: boolean;
          created_at: string;
          normalization_state: string;
          proposed_action: string;
          source_record_id: string;
          validation_errors: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          batch_id: string;
          boundary_result: string;
          content_changed: boolean;
          created_at?: string;
          normalization_state: string;
          proposed_action: string;
          source_record_id: string;
          validation_errors?: NonNullable<Json>;
        };
        Update: {
          batch_id?: string;
          boundary_result?: string;
          content_changed?: boolean;
          created_at?: string;
          normalization_state?: string;
          proposed_action?: string;
          source_record_id?: string;
          validation_errors?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "import_batch_records_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "import_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "import_batch_records_source_record_id_fkey";
            columns: ["source_record_id"];
            isOneToOne: false;
            referencedRelation: "source_records";
            referencedColumns: ["id"];
          },
        ];
      };
      import_batches: {
        Row: {
          adapter_version: string;
          boundary_id: string;
          created_at: string;
          created_count: number;
          failure_classification: string | null;
          fetched_count: number;
          finished_at: string | null;
          id: string;
          normalized_count: number;
          rejected_count: number;
          schema_version: number;
          source_checksum: string;
          source_id: string;
          source_snapshot: string;
          started_at: string | null;
          status: Database["catalog"]["Enums"]["import_status"];
          trigger_type: string;
          unchanged_count: number;
          updated_count: number;
          validation_summary: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          adapter_version: string;
          boundary_id: string;
          created_at?: string;
          created_count?: number;
          failure_classification?: string | null;
          fetched_count?: number;
          finished_at?: string | null;
          id?: string;
          normalized_count?: number;
          rejected_count?: number;
          schema_version: number;
          source_checksum: string;
          source_id: string;
          source_snapshot: string;
          started_at?: string | null;
          status?: Database["catalog"]["Enums"]["import_status"];
          trigger_type: string;
          unchanged_count?: number;
          updated_count?: number;
          validation_summary?: NonNullable<Json>;
        };
        Update: {
          adapter_version?: string;
          boundary_id?: string;
          created_at?: string;
          created_count?: number;
          failure_classification?: string | null;
          fetched_count?: number;
          finished_at?: string | null;
          id?: string;
          normalized_count?: number;
          rejected_count?: number;
          schema_version?: number;
          source_checksum?: string;
          source_id?: string;
          source_snapshot?: string;
          started_at?: string | null;
          status?: Database["catalog"]["Enums"]["import_status"];
          trigger_type?: string;
          unchanged_count?: number;
          updated_count?: number;
          validation_summary?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "import_batches_boundary_id_fkey";
            columns: ["boundary_id"];
            isOneToOne: false;
            referencedRelation: "city_boundaries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "import_batches_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      moderation_decisions: {
        Row: {
          accepted_fields: NonNullable<Json>;
          actor_type: string;
          decided_at: string;
          decided_by: string | null;
          evidence: NonNullable<Json>;
          id: string;
          origin_batch_id: string;
          outcome: string;
          rationale: string;
          reason_code: string;
          source_record_id: string;
          superseded_by_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          accepted_fields?: NonNullable<Json>;
          actor_type?: string;
          decided_at?: string;
          decided_by?: string | null;
          evidence?: NonNullable<Json>;
          id?: string;
          origin_batch_id: string;
          outcome: string;
          rationale: string;
          reason_code: string;
          source_record_id: string;
          superseded_by_id?: string | null;
        };
        Update: {
          accepted_fields?: NonNullable<Json>;
          actor_type?: string;
          decided_at?: string;
          decided_by?: string | null;
          evidence?: NonNullable<Json>;
          id?: string;
          origin_batch_id?: string;
          outcome?: string;
          rationale?: string;
          reason_code?: string;
          source_record_id?: string;
          superseded_by_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_decisions_origin_batch_id_fkey";
            columns: ["origin_batch_id"];
            isOneToOne: false;
            referencedRelation: "import_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moderation_decisions_source_record_id_fkey";
            columns: ["source_record_id"];
            isOneToOne: false;
            referencedRelation: "source_records";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moderation_decisions_superseded_by_id_fkey";
            columns: ["superseded_by_id"];
            isOneToOne: false;
            referencedRelation: "moderation_decisions";
            referencedColumns: ["id"];
          },
        ];
      };
      place_locations: {
        Row: {
          address_line: string | null;
          created_at: string;
          display_address: string | null;
          id: string;
          is_current: boolean;
          location_precision: string;
          place_id: string;
          point: unknown;
          public_pickup_confirmed: boolean;
          valid_from: string;
          valid_to: string | null;
        };
        ComputedFields: never;
        Insert: {
          address_line?: string | null;
          created_at?: string;
          display_address?: string | null;
          id?: string;
          is_current?: boolean;
          location_precision: string;
          place_id: string;
          point: unknown;
          public_pickup_confirmed?: boolean;
          valid_from?: string;
          valid_to?: string | null;
        };
        Update: {
          address_line?: string | null;
          created_at?: string;
          display_address?: string | null;
          id?: string;
          is_current?: boolean;
          location_precision?: string;
          place_id?: string;
          point?: unknown;
          public_pickup_confirmed?: boolean;
          valid_from?: string;
          valid_to?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "place_locations_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
        ];
      };
      place_media: {
        Row: {
          alt_text: string;
          attribution_text: string | null;
          bucket_id: string;
          byte_size: number;
          content_sha256: string;
          created_at: string;
          height: number;
          id: string;
          license_name: string | null;
          license_url: string | null;
          media_type: string;
          object_path: string;
          place_id: string;
          publication_state: string;
          published_at: string;
          rights_basis: string;
          rights_confirmed_at: string;
          rights_reference: string;
          sort_order: number;
          source_url: string | null;
          width: number;
          withdrawal_reason: string | null;
          withdrawn_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          alt_text: string;
          attribution_text?: string | null;
          bucket_id?: string;
          byte_size: number;
          content_sha256: string;
          created_at?: string;
          height: number;
          id?: string;
          license_name?: string | null;
          license_url?: string | null;
          media_type: string;
          object_path: string;
          place_id: string;
          publication_state?: string;
          published_at?: string;
          rights_basis: string;
          rights_confirmed_at: string;
          rights_reference: string;
          sort_order?: number;
          source_url?: string | null;
          width: number;
          withdrawal_reason?: string | null;
          withdrawn_at?: string | null;
        };
        Update: {
          alt_text?: string;
          attribution_text?: string | null;
          bucket_id?: string;
          byte_size?: number;
          content_sha256?: string;
          created_at?: string;
          height?: number;
          id?: string;
          license_name?: string | null;
          license_url?: string | null;
          media_type?: string;
          object_path?: string;
          place_id?: string;
          publication_state?: string;
          published_at?: string;
          rights_basis?: string;
          rights_confirmed_at?: string;
          rights_reference?: string;
          sort_order?: number;
          source_url?: string | null;
          width?: number;
          withdrawal_reason?: string | null;
          withdrawn_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "place_media_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
        ];
      };
      places: {
        Row: {
          activated_at: string | null;
          canonical_name: string;
          closed_at: string | null;
          created_at: string;
          id: string;
          last_reviewed_at: string | null;
          lifecycle_status: Database["catalog"]["Enums"]["place_lifecycle_status"];
          merged_into_place_id: string | null;
          primary_category_id: string | null;
          public_notes: string | null;
          search_name: string;
          updated_at: string;
          verification_state: Database["catalog"]["Enums"]["verification_state"];
        };
        ComputedFields: never;
        Insert: {
          activated_at?: string | null;
          canonical_name: string;
          closed_at?: string | null;
          created_at?: string;
          id?: string;
          last_reviewed_at?: string | null;
          lifecycle_status?: Database["catalog"]["Enums"]["place_lifecycle_status"];
          merged_into_place_id?: string | null;
          primary_category_id?: string | null;
          public_notes?: string | null;
          search_name: string;
          updated_at?: string;
          verification_state?: Database["catalog"]["Enums"]["verification_state"];
        };
        Update: {
          activated_at?: string | null;
          canonical_name?: string;
          closed_at?: string | null;
          created_at?: string;
          id?: string;
          last_reviewed_at?: string | null;
          lifecycle_status?: Database["catalog"]["Enums"]["place_lifecycle_status"];
          merged_into_place_id?: string | null;
          primary_category_id?: string | null;
          public_notes?: string | null;
          search_name?: string;
          updated_at?: string;
          verification_state?: Database["catalog"]["Enums"]["verification_state"];
        };
        Relationships: [
          {
            foreignKeyName: "places_merged_into_place_id_fkey";
            columns: ["merged_into_place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "places_primary_category_id_fkey";
            columns: ["primary_category_id"];
            isOneToOne: false;
            referencedRelation: "taxonomies";
            referencedColumns: ["id"];
          },
        ];
      };
      source_records: {
        Row: {
          content_hash: string;
          created_at: string;
          external_record_key: string;
          id: string;
          latest_seen_batch_id: string | null;
          licensing_classification: string;
          normalized_payload: NonNullable<Json>;
          payload_schema_version: number;
          raw_payload_expires_at: string | null;
          retrieved_at: string;
          source_id: string;
          source_updated_at: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          content_hash: string;
          created_at?: string;
          external_record_key: string;
          id?: string;
          latest_seen_batch_id?: string | null;
          licensing_classification: string;
          normalized_payload: NonNullable<Json>;
          payload_schema_version: number;
          raw_payload_expires_at?: string | null;
          retrieved_at: string;
          source_id: string;
          source_updated_at?: string | null;
          updated_at?: string;
        };
        Update: {
          content_hash?: string;
          created_at?: string;
          external_record_key?: string;
          id?: string;
          latest_seen_batch_id?: string | null;
          licensing_classification?: string;
          normalized_payload?: NonNullable<Json>;
          payload_schema_version?: number;
          raw_payload_expires_at?: string | null;
          retrieved_at?: string;
          source_id?: string;
          source_updated_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_records_latest_seen_batch_fk";
            columns: ["latest_seen_batch_id"];
            isOneToOne: false;
            referencedRelation: "import_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_records_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      sources: {
        Row: {
          attribution_text: string | null;
          collection_allowed: boolean;
          created_at: string;
          display_allowed: boolean;
          display_name: string;
          homepage_url: string | null;
          id: string;
          is_active: boolean;
          license_url: string | null;
          modification_allowed: boolean;
          next_terms_review_due_at: string | null;
          raw_payload_retention_days: number | null;
          redistribution_allowed: boolean;
          slug: string;
          source_type: string;
          storage_allowed: boolean;
          terms_reviewed_at: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          attribution_text?: string | null;
          collection_allowed?: boolean;
          created_at?: string;
          display_allowed?: boolean;
          display_name: string;
          homepage_url?: string | null;
          id?: string;
          is_active?: boolean;
          license_url?: string | null;
          modification_allowed?: boolean;
          next_terms_review_due_at?: string | null;
          raw_payload_retention_days?: number | null;
          redistribution_allowed?: boolean;
          slug: string;
          source_type: string;
          storage_allowed?: boolean;
          terms_reviewed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          attribution_text?: string | null;
          collection_allowed?: boolean;
          created_at?: string;
          display_allowed?: boolean;
          display_name?: string;
          homepage_url?: string | null;
          id?: string;
          is_active?: boolean;
          license_url?: string | null;
          modification_allowed?: boolean;
          next_terms_review_due_at?: string | null;
          raw_payload_retention_days?: number | null;
          redistribution_allowed?: boolean;
          slug?: string;
          source_type?: string;
          storage_allowed?: boolean;
          terms_reviewed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      taxonomies: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          label: string;
          parent_id: string | null;
          slug: string;
          sort_order: number;
          taxonomy_type: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          label: string;
          parent_id?: string | null;
          slug: string;
          sort_order?: number;
          taxonomy_type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          label?: string;
          parent_id?: string | null;
          slug?: string;
          sort_order?: number;
          taxonomy_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "taxonomies_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "taxonomies";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      import_status:
        | "queued"
        | "acquiring"
        | "normalizing"
        | "matching"
        | "awaiting_review"
        | "validating"
        | "published"
        | "rejected"
        | "failed";
      place_lifecycle_status:
        | "draft"
        | "active"
        | "temporarily_closed"
        | "permanently_closed"
        | "moved"
        | "merged"
        | "archived";
      price_tier: "budget" | "affordable" | "moderate" | "upper_mid_range" | "premium";
      verification_state:
        | "unverified"
        | "source_supported"
        | "community_supported"
        | "owner_confirmed"
        | "review_required";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          completed_at: string | null;
          confirmed_at: string | null;
          failure_code: string | null;
          id: string;
          profile_id: string;
          requested_at: string;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          completed_at?: string | null;
          confirmed_at?: string | null;
          failure_code?: string | null;
          id?: string;
          profile_id: string;
          requested_at?: string;
          status: string;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          confirmed_at?: string | null;
          failure_code?: string | null;
          id?: string;
          profile_id?: string;
          requested_at?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_deletion_requests_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      evidence_attachments: {
        Row: {
          byte_size: number;
          content_hash: string;
          created_at: string;
          delete_due_at: string;
          exif_removed: boolean;
          height_pixels: number | null;
          id: string;
          mime_type: string;
          object_key: string;
          retention_class: string;
          rights_confirmed_at: string;
          safe_filename: string;
          scan_state: string;
          submission_id: string;
          updated_at: string;
          upload_state: string;
          width_pixels: number | null;
        };
        ComputedFields: never;
        Insert: {
          byte_size: number;
          content_hash: string;
          created_at?: string;
          delete_due_at: string;
          exif_removed?: boolean;
          height_pixels?: number | null;
          id?: string;
          mime_type: string;
          object_key: string;
          retention_class: string;
          rights_confirmed_at: string;
          safe_filename: string;
          scan_state?: string;
          submission_id: string;
          updated_at?: string;
          upload_state: string;
          width_pixels?: number | null;
        };
        Update: {
          byte_size?: number;
          content_hash?: string;
          created_at?: string;
          delete_due_at?: string;
          exif_removed?: boolean;
          height_pixels?: number | null;
          id?: string;
          mime_type?: string;
          object_key?: string;
          retention_class?: string;
          rights_confirmed_at?: string;
          safe_filename?: string;
          scan_state?: string;
          submission_id?: string;
          updated_at?: string;
          upload_state?: string;
          width_pixels?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "evidence_attachments_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          created_at: string;
          place_id: string;
          profile_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          place_id: string;
          profile_id: string;
        };
        Update: {
          created_at?: string;
          place_id?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"];
          created_at: string;
          deletion_completed_at: string | null;
          id: string;
          locale: string;
          navigation_provider: string;
          privacy_notice_accepted_at: string | null;
          privacy_notice_version: string | null;
          theme_preference: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"];
          created_at?: string;
          deletion_completed_at?: string | null;
          id: string;
          locale?: string;
          navigation_provider?: string;
          privacy_notice_accepted_at?: string | null;
          privacy_notice_version?: string | null;
          theme_preference?: string;
          updated_at?: string;
        };
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"];
          created_at?: string;
          deletion_completed_at?: string | null;
          id?: string;
          locale?: string;
          navigation_provider?: string;
          privacy_notice_accepted_at?: string | null;
          privacy_notice_version?: string | null;
          theme_preference?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      submission_changes: {
        Row: {
          accepted_provenance_id: string | null;
          change_type: string;
          created_at: string;
          id: string;
          proposed_value_hash: string;
          review_state: Database["public"]["Enums"]["submission_review_state"];
          schema_version: number;
          submission_id: string;
          target_field: string;
          updated_at: string;
          validated_payload: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          accepted_provenance_id?: string | null;
          change_type: string;
          created_at?: string;
          id?: string;
          proposed_value_hash: string;
          review_state?: Database["public"]["Enums"]["submission_review_state"];
          schema_version: number;
          submission_id: string;
          target_field: string;
          updated_at?: string;
          validated_payload: NonNullable<Json>;
        };
        Update: {
          accepted_provenance_id?: string | null;
          change_type?: string;
          created_at?: string;
          id?: string;
          proposed_value_hash?: string;
          review_state?: Database["public"]["Enums"]["submission_review_state"];
          schema_version?: number;
          submission_id?: string;
          target_field?: string;
          updated_at?: string;
          validated_payload?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "submission_changes_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
        ];
      };
      submission_status_events: {
        Row: {
          created_at: string;
          from_status: Database["public"]["Enums"]["submission_status"] | null;
          id: string;
          public_message: string | null;
          submission_id: string;
          to_status: Database["public"]["Enums"]["submission_status"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          from_status?: Database["public"]["Enums"]["submission_status"] | null;
          id?: string;
          public_message?: string | null;
          submission_id: string;
          to_status: Database["public"]["Enums"]["submission_status"];
        };
        Update: {
          created_at?: string;
          from_status?: Database["public"]["Enums"]["submission_status"] | null;
          id?: string;
          public_message?: string | null;
          submission_id?: string;
          to_status?: Database["public"]["Enums"]["submission_status"];
        };
        Relationships: [
          {
            foreignKeyName: "submission_status_events_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
        ];
      };
      submissions: {
        Row: {
          created_at: string;
          id: string;
          issue_type: string;
          place_id: string | null;
          policy_version: string;
          profile_id: string | null;
          public_reference: string;
          rights_confirmed_at: string | null;
          status: Database["public"]["Enums"]["submission_status"];
          submitted_at: string | null;
          updated_at: string;
          user_summary: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          issue_type: string;
          place_id?: string | null;
          policy_version: string;
          profile_id?: string | null;
          public_reference: string;
          rights_confirmed_at?: string | null;
          status?: Database["public"]["Enums"]["submission_status"];
          submitted_at?: string | null;
          updated_at?: string;
          user_summary?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          issue_type?: string;
          place_id?: string | null;
          policy_version?: string;
          profile_id?: string | null;
          public_reference?: string;
          rights_confirmed_at?: string | null;
          status?: Database["public"]["Enums"]["submission_status"];
          submitted_at?: string | null;
          updated_at?: string;
          user_summary?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      wheel_entries: {
        Row: {
          created_at: string;
          duplicate_confirmed: boolean;
          entry_kind: string;
          id: string;
          label_snapshot: string;
          place_id: string | null;
          position: number;
          updated_at: string;
          wheel_list_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          duplicate_confirmed?: boolean;
          entry_kind: string;
          id?: string;
          label_snapshot: string;
          place_id?: string | null;
          position: number;
          updated_at?: string;
          wheel_list_id: string;
        };
        Update: {
          created_at?: string;
          duplicate_confirmed?: boolean;
          entry_kind?: string;
          id?: string;
          label_snapshot?: string;
          place_id?: string | null;
          position?: number;
          updated_at?: string;
          wheel_list_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wheel_entries_wheel_list_id_fkey";
            columns: ["wheel_list_id"];
            isOneToOne: false;
            referencedRelation: "wheel_lists";
            referencedColumns: ["id"];
          },
        ];
      };
      wheel_lists: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          profile_id: string;
          sort_position: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          profile_id: string;
          sort_position?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          profile_id?: string;
          sort_position?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wheel_lists_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      place_discovery: {
        Row: {
          canonical_name: string | null;
          category_label: string | null;
          category_slug: string | null;
          craving_slugs: string[] | null;
          cuisine_labels: string[] | null;
          display_address: string | null;
          latitude: number | null;
          longitude: number | null;
          maximum_centavos: number | null;
          minimum_centavos: number | null;
          occasion_slugs: string[] | null;
          place_id: string | null;
          place_slug: string | null;
          price_confidence: string | null;
          price_current_through: string | null;
          price_tier: Database["catalog"]["Enums"]["price_tier"] | null;
          published_at: string | null;
          source_attribution: string | null;
          source_label: string | null;
          verification_state: Database["catalog"]["Enums"]["verification_state"] | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      place_markers: {
        Row: {
          canonical_name: string | null;
          category_label: string | null;
          category_slug: string | null;
          latitude: number | null;
          longitude: number | null;
          place_id: string | null;
          place_slug: string | null;
          price_tier: Database["catalog"]["Enums"]["price_tier"] | null;
          verification_state: Database["catalog"]["Enums"]["verification_state"] | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      place_media: {
        Row: {
          alt_text: string | null;
          attribution_text: string | null;
          bucket_id: string | null;
          height: number | null;
          license_name: string | null;
          license_url: string | null;
          media_id: string | null;
          media_type: string | null;
          object_path: string | null;
          place_id: string | null;
          place_slug: string | null;
          published_at: string | null;
          sort_order: number | null;
          source_url: string | null;
          width: number | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      publish_osm_import: { Args: { p_batch_id: string }; Returns: Json };
      publish_overture_import: { Args: { p_batch_id: string }; Returns: Json };
      publish_overture_moderation_release: {
        Args: { p_origin_batch_id: string; p_payload: Json };
        Returns: Json;
      };
      publish_place_media: {
        Args: {
          p_alt_text: string;
          p_attribution_text: string;
          p_byte_size: number;
          p_content_sha256: string;
          p_height: number;
          p_license_name: string;
          p_license_url: string;
          p_media_type: string;
          p_object_path: string;
          p_place_slug: string;
          p_rights_basis: string;
          p_rights_confirmed_at: string;
          p_rights_reference: string;
          p_sort_order: number;
          p_source_url: string;
          p_width: number;
        };
        Returns: string;
      };
      replace_wheel_entries: {
        Args: { p_entries: Json; p_wheel_list_id: string };
        Returns: {
          created_at: string;
          duplicate_confirmed: boolean;
          entry_kind: string;
          id: string;
          label_snapshot: string;
          place_id: string | null;
          position: number;
          updated_at: string;
          wheel_list_id: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "wheel_entries";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      stage_osm_import: { Args: { p_payload: Json }; Returns: Json };
      stage_overture_import: { Args: { p_payload: Json }; Returns: Json };
      withdraw_place_media: { Args: { p_media_id: string; p_reason: string }; Returns: undefined };
    };
    Enums: {
      account_status: "active" | "deletion_requested" | "disabled" | "deleted";
      submission_review_state: "pending" | "accepted" | "rejected" | "needs_information";
      submission_status:
        | "draft"
        | "submitted"
        | "in_review"
        | "needs_information"
        | "partially_approved"
        | "approved"
        | "rejected"
        | "withdrawn";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  catalog: {
    Enums: {
      import_status: [
        "queued",
        "acquiring",
        "normalizing",
        "matching",
        "awaiting_review",
        "validating",
        "published",
        "rejected",
        "failed",
      ],
      place_lifecycle_status: [
        "draft",
        "active",
        "temporarily_closed",
        "permanently_closed",
        "moved",
        "merged",
        "archived",
      ],
      price_tier: ["budget", "affordable", "moderate", "upper_mid_range", "premium"],
      verification_state: [
        "unverified",
        "source_supported",
        "community_supported",
        "owner_confirmed",
        "review_required",
      ],
    },
  },
  public: {
    Enums: {
      account_status: ["active", "deletion_requested", "disabled", "deleted"],
      submission_review_state: ["pending", "accepted", "rejected", "needs_information"],
      submission_status: [
        "draft",
        "submitted",
        "in_review",
        "needs_information",
        "partially_approved",
        "approved",
        "rejected",
        "withdrawn",
      ],
    },
  },
} as const;
