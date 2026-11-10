export interface UserInterface {
   nickname: string;
   name: string;
   password: string;
   salt: string;
   bio?: string;
   location?: string;
   socialmedia?: string;
   filmGenres?: string;
   emailOnFollow?: boolean;
}
