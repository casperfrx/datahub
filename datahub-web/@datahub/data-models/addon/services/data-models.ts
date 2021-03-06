import Service from '@ember/service';
import { DataModelEntity, DataModelName, DataModelEntityInstance } from '@datahub/data-models/constants/entity';
import { set } from '@ember/object';
import { isBaseEntity } from '@datahub/data-models/entity/base-entity';
import { DatasetEntity } from '@datahub/data-models/entity/dataset/dataset-entity';

/**
 * Encapsulating Guards logic into this class so it is easier to move if data-models grow
 */
export class Guards {
  dataModels!: DataModelsService;

  /**
   * Contructor for guards class
   * @param dataModels dataModels service to identify properly the class type
   */
  constructor(dataModels: DataModelsService) {
    this.dataModels = dataModels;
  }

  /**
   * List of unguarded entities
   */
  get unGuardedEntitiesDisplayName(): Array<DataModelName> {
    return [DatasetEntity.displayName];
  }

  /**
   * Maps the unguarded display name to entity using getModel
   */
  get unGuardedEntities(): Array<DataModelEntity> {
    return this.unGuardedEntitiesDisplayName.map(
      (entityDisplayName): DataModelEntity => this.dataModels.getModel(entityDisplayName)
    );
  }

  /**
   * Will check if the entity provided is guarded (it should not show)
   * @param name name of the entity
   */
  isGuardedEntity(name: DataModelName): boolean {
    return this.unGuardedEntitiesDisplayName.indexOf(name) < 0;
  }
}

/**
 * The data models service is meant to provide access to the models available in data models. The
 * reason this exists is to allow for the ability to use said models without a direct import of
 * the model types to the consuming addons. This makes it easier to separate our open source and
 * internal logic per model and implementation of that model
 */
export default class DataModelsService extends Service {
  /**
   * Guards for the data-models
   */
  guards: Guards = new Guards(this);

  /**
   * Returns a given data model class in order to be instantiated by the consumer.
   * @example
   * usage =>
   * const datasetModel = DataModelsService.getModel('dataset');
   * const someInstance = new datasetModel('urn', optionalParams);
   *
   * @param modelKey - key that determines which model we should be returning
   */
  getModel<K extends DataModelName>(modelKey: K): typeof DataModelEntity[K] {
    return DataModelEntity[modelKey];
  }

  /**
   * Creates a partial instance given the "entity" part of the model. This is useful for bulk
   * loads like Search or Lists or if we want to rely on the data models service to create an
   * entity instance for us given an entity type and urn
   * @param modelKey Model name of the entity
   * @param data 'Entity' data part
   */
  createPartialInstance<K extends DataModelName>(
    modelKey: K,
    data: DataModelEntityInstance['entity'] | string
  ): InstanceType<typeof DataModelEntity[K]> {
    const EntityClass = this.getModel(modelKey);
    let instance: InstanceType<typeof DataModelEntity[K]>;

    if (typeof data === 'string') {
      instance = new EntityClass(data) as InstanceType<typeof DataModelEntity[K]>;
    } else {
      const urn: string = isBaseEntity(data) && data.urn ? data.urn : '';
      instance = new EntityClass(urn) as InstanceType<typeof DataModelEntity[K]>;
      set(instance, 'entity', data as typeof instance['entity']);
    }

    return instance;
  }

  /**
   * Will create an instance by fetching the necessary data for it.
   * @param modelKey Model name of the entity
   * @param urn id of the entity
   */
  async createInstance<K extends DataModelName>(
    modelKey: K,
    urn: string
  ): Promise<InstanceType<typeof DataModelEntity[K]>> {
    const EntityClass = this.getModel(modelKey);
    const entity = new EntityClass(urn) as InstanceType<typeof DataModelEntity[K]>;
    // Post instantiation, request the underlying Entity instance and Snapshot
    // and set the related instance attributes with references to the value
    set(entity, 'entity', await entity.readEntity);
    set(entity, 'snapshot', await entity.readSnapshot);

    await entity.onAfterCreate();

    return entity;
  }

  /**
   * Stores the data model entities mapping on the service so that it can be accessed within the
   * class and within any child classes without a direct import
   */
  dataModelEntitiesMap = DataModelEntity;
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  // This is a core ember thing
  //eslint-disable-next-line @typescript-eslint/interface-name-prefix
  interface Registry {
    'data-models': DataModelsService;
  }
}
