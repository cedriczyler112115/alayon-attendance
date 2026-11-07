<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'firstname' => ['required', 'string', 'max:255'],
            'middlename' => ['nullable', 'string', 'max:255'],
            'lastname' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'password' => $this->passwordRules(),
        ])->validate();

        $middleName = ! empty($input['middlename']) ? trim($input['middlename']) : null;
        $name = trim("{$input['firstname']} ".($middleName ? "{$middleName} " : '')."{$input['lastname']}");

        return User::create([
            'firstname' => $input['firstname'],
            'middlename' => $middleName,
            'lastname' => $input['lastname'],
            'name' => $name,
            'email' => $input['email'],
            'password' => Hash::make($input['password']),
            'email_verified_at' => now(),
        ]);
    }
}
