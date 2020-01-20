import { getRepository } from 'typeorm';
import { UserInfo } from '../../../../common/models/profile';
import {
  User,
} from '../../models';

export const getUserInfo = async (githubId: string): Promise<UserInfo> => {
  const rawUser = await getRepository(User)
    .createQueryBuilder('user')
    .select('"user"."firstName" AS "firstName", "user"."lastName" AS "lastName"')
    .addSelect('"user"."githubId" AS "githubId"')
    .addSelect('"user"."locationName" AS "locationName"')
    .addSelect('"user"."educationHistory" AS "educationHistory"')
    .addSelect('"user"."employmentHistory" AS "employmentHistory"')
    .addSelect('"user"."englishLevel" AS "englishLevel"')
    .addSelect('"user"."contactsPhone" AS "contactsPhone"')
    .addSelect('"user"."contactsEmail" AS "contactsEmail"')
    .addSelect('"user"."contactsTelegram" AS "contactsTelegram"')
    .addSelect('"user"."contactsSkype" AS "contactsSkype"')
    .addSelect('"user"."contactsNotes" AS "contactsNotes"')
    .addSelect('"user"."aboutMyself" AS "aboutMyself"')
    .where('"user"."githubId" = :githubId', { githubId })
    .getRawOne();

  const {
    firstName,
    lastName,
    locationName,
    educationHistory,
    employmentHistory,
    englishLevel,
    contactsPhone,
    contactsEmail,
    contactsTelegram,
    contactsSkype,
    contactsNotes,
    aboutMyself,
  } = rawUser;

  return {
    generalInfo: {
      githubId,
      aboutMyself,
      locationName,
      educationHistory,
      employmentHistory,
      englishLevel,
      name: getFullName(firstName, lastName),
    },
    contacts: {
      phone: contactsPhone,
      email: contactsEmail,
      skype: contactsSkype,
      telegram: contactsTelegram,
      notes: contactsNotes,
    },
  };
};