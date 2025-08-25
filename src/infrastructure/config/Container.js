import { FileSystemExtractionRepository } from "../adapters/FileSystemExtractionRepository.js";
import { LocalExtractionService } from "../adapters/LocalExtractionService.js";
import { LocalS3StorageService } from "../adapters/LocalS3StorageService.js";
import { FileSystemJobRepository } from "../adapters/FileSystemJobRepository.js";
import { FileSystemDocumentRepository } from "../adapters/FileSystemDocumentRepository.js";
import { MockExtractorProvider } from "../adapters/MockExtractorProvider.js";
import { LocalOutputService } from "../adapters/LocalOutputService.js";
import { CreateExtractionUseCase } from "../../application/use-cases/CreateExtractionUseCase.js";
import { GetExtractionUseCase } from "../../application/use-cases/GetExtractionUseCase.js";
import { ListExtractionsUseCase } from "../../application/use-cases/ListExtractionsUseCase.js";
import { ProcessJobUseCase } from "../../application/use-cases/ProcessJobUseCase.js";
import { ExtractionController } from "../../interfaces/controllers/ExtractionController.js";
import { JobController } from "../../interfaces/controllers/JobController.js";

/**
 * Dependency Injection Container
 * Manages the creation and wiring of all components
 * This is part of the infrastructure layer in hexagon architecture
 */
export class Container {
  constructor() {
    this.instances = new Map();
  }

  /**
   * Gets or creates an instance of a component
   * @param {string} key - Component key
   * @param {Function} factory - Factory function to create instance
   * @returns {any} Component instance
   */
  getOrCreate(key, factory) {
    if (!this.instances.has(key)) {
      this.instances.set(key, factory());
    }
    return this.instances.get(key);
  }

  /**
   * Gets the extraction repository
   * @returns {FileSystemExtractionRepository} Extraction repository instance
   */
  getExtractionRepository() {
    return this.getOrCreate("extractionRepository", () => {
      return new FileSystemExtractionRepository();
    });
  }

  /**
   * Gets the job repository
   * @returns {FileSystemJobRepository} Job repository instance
   */
  getJobRepository() {
    return this.getOrCreate("jobRepository", () => {
      return new FileSystemJobRepository();
    });
  }

  /**
   * Gets the document repository
   * @returns {FileSystemDocumentRepository} Document repository instance
   */
  getDocumentRepository() {
    return this.getOrCreate("documentRepository", () => {
      return new FileSystemDocumentRepository();
    });
  }

  /**
   * Gets the extraction service
   * @returns {LocalExtractionService} Extraction service instance
   */
  getExtractionService() {
    return this.getOrCreate("extractionService", () => {
      return new LocalExtractionService();
    });
  }

  /**
   * Gets the storage service
   * @returns {LocalS3StorageService} Storage service instance
   */
  getStorageService() {
    return this.getOrCreate("storageService", () => {
      return new LocalS3StorageService();
    });
  }

  /**
   * Gets the extractor provider
   * @returns {MockExtractorProvider} Extractor provider instance
   */
  getExtractorProvider() {
    return this.getOrCreate("extractorProvider", () => {
      return new MockExtractorProvider();
    });
  }

  /**
   * Gets the output service
   * @returns {LocalOutputService} Output service instance
   */
  getOutputService() {
    return this.getOrCreate("outputService", () => {
      return new LocalOutputService();
    });
  }

  /**
   * Gets the create extraction use case
   * @returns {CreateExtractionUseCase} Create extraction use case instance
   */
  getCreateExtractionUseCase() {
    return this.getOrCreate("createExtractionUseCase", () => {
      return new CreateExtractionUseCase(
        this.getExtractionRepository(),
        this.getExtractionService(),
        this.getStorageService()
      );
    });
  }

  /**
   * Gets the get extraction use case
   * @returns {GetExtractionUseCase} Get extraction use case instance
   */
  getGetExtractionUseCase() {
    return this.getOrCreate("getExtractionUseCase", () => {
      return new GetExtractionUseCase(this.getExtractionRepository());
    });
  }

  /**
   * Gets the list extractions use case
   * @returns {ListExtractionsUseCase} List extractions use case instance
   */
  getListExtractionsUseCase() {
    return this.getOrCreate("listExtractionsUseCase", () => {
      return new ListExtractionsUseCase(this.getExtractionRepository());
    });
  }

  /**
   * Gets the process job use case
   * @returns {ProcessJobUseCase} Process job use case instance
   */
  getProcessJobUseCase() {
    return this.getOrCreate("processJobUseCase", () => {
      return new ProcessJobUseCase(
        this.getJobRepository(),
        this.getDocumentRepository(),
        this.getStorageService(),
        this.getExtractorProvider(),
        this.getOutputService()
      );
    });
  }

  /**
   * Gets the extraction controller
   * @returns {ExtractionController} Extraction controller instance
   */
  getExtractionController() {
    return this.getOrCreate("extractionController", () => {
      return new ExtractionController(
        this.getCreateExtractionUseCase(),
        this.getGetExtractionUseCase(),
        this.getListExtractionsUseCase()
      );
    });
  }

  /**
   * Gets the job controller
   * @returns {JobController} Job controller instance
   */
  getJobController() {
    return this.getOrCreate("jobController", () => {
      return new JobController(
        this.getJobRepository(),
        this.getDocumentRepository(),
        this.getStorageService(),
        this.getProcessJobUseCase()
      );
    });
  }
}

// Export singleton instance
export const container = new Container();
